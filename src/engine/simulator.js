// Reconstructed from Metro module 730 (decompiled.js lines 280405–281188)
// PathSimulator: computes metrics for each solved path, scores and ranks them,
// and computes a 0–100 confidence value for a chosen path.

import { ENGINE_CONFIG } from './utils';

export class PathSimulator {
  static simulateAndRank(graph, solvedPaths, referenceDateInput) {
    const referenceDate = new Date(referenceDateInput);
    const horizonDays = ENGINE_CONFIG.HORIZON_WINDOW_DAYS; // read but never used

    // 1) Metrics per path.
    solvedPaths.forEach((solved) => {
      const path = solved.path;

      let expectedTime = 0;
      path.steps.forEach((step) => {
        expectedTime = expectedTime + step.duration;
      });

      let acceptanceProbability = 1;
      path.steps.forEach((step) => {
        acceptanceProbability = acceptanceProbability * step.probability;
      });

      // Smallest number of days left before any required document expires.
      let minSlackDays = Infinity;
      path.steps.forEach((step) => {
        const serviceId = this.extractServiceId(step.id);
        graph.getIncomingEdges(serviceId).forEach((edge) => {
          const node = graph.getNode(edge.sourceId);
          if (node && node.type === 'DOCUMENT' && node.expiryDate) {
            const slack = Math.max(
              0,
              Math.ceil((new Date(node.expiryDate).getTime() - referenceDate.getTime()) / 86400000)
            );
            if (slack < minSlackDays) {
              minSlackDays = slack;
            }
          }
        });
      });

      let delayRisk = 0;
      if (minSlackDays !== Infinity) {
        delayRisk = expectedTime > minSlackDays ? 1 : expectedTime / (minSlackDays + 1);
      }

      const uniqueDocs = new Set();
      path.steps.forEach((step) => {
        step.requiredDocs.forEach((doc) => uniqueDocs.add(doc));
      });
      const docCount = uniqueDocs.size;

      const impactedNodes = new Set();
      path.steps.forEach((step) => {
        const serviceId = this.extractServiceId(step.id);
        graph.bfs(serviceId, ENGINE_CONFIG.DEFAULT_CAUSAL_DEPTH, (nodeId) => {
          if (nodeId !== serviceId) {
            impactedNodes.add(nodeId);
          }
        });
      });
      const crossImpact = impactedNodes.size;

      solved.metrics = {
        expectedTime,
        acceptanceProbability,
        delayRisk,
        docCount,
        crossImpact,
      };
    });

    // 2) Min/max of each metric across ALL paths (valid and invalid).
    let minTime = Infinity;
    let maxTime = -Infinity;
    let minDocs = Infinity;
    let maxDocs = -Infinity;
    let minImpact = Infinity;
    let maxImpact = -Infinity;

    solvedPaths.forEach((solved) => {
      const m = solved.metrics;
      if (m.expectedTime < minTime) minTime = m.expectedTime;
      if (m.expectedTime > maxTime) maxTime = m.expectedTime;
      if (m.docCount < minDocs) minDocs = m.docCount;
      if (m.docCount > maxDocs) maxDocs = m.docCount;
      if (m.crossImpact < minImpact) minImpact = m.crossImpact;
      if (m.crossImpact > maxImpact) maxImpact = m.crossImpact;
    });

    const norm = (value, min, max) => (max !== min ? (value - min) / (max - min) : 0);

    // 3) Weighted score in [0, 1]; invalid paths get 0.
    solvedPaths.forEach((solved) => {
      if (!solved.isValid) {
        solved.score = 0;
        return;
      }
      const m = solved.metrics;
      const w = ENGINE_CONFIG.PATH_OBJECTIVE_WEIGHTS;
      const timeNorm = norm(m.expectedTime, minTime, maxTime);
      const docsNorm = norm(m.docCount, minDocs, maxDocs);
      const impactNorm = norm(m.crossImpact, minImpact, maxImpact);

      const raw =
        w.probability * m.acceptanceProbability +
        w.time * (1 - timeNorm) +
        w.delayRisk * (1 - m.delayRisk) +
        w.docCount * (1 - docsNorm) +
        w.crossImpact * (1 - impactNorm);

      solved.score = Math.max(0, Math.min(1, raw));
    });

    // 4) Valid paths first, then by descending score. (Sorts the input array in place.)
    solvedPaths.sort((a, b) => {
      if (a.isValid && !b.isValid) return -1;
      if (!a.isValid && b.isValid) return 1;
      return b.score - a.score;
    });

    return solvedPaths;
  }

  static calculateConfidence(graph, path, isPathValid, referenceDateInput) {
    const referenceDate = new Date(referenceDateInput);
    const weights = ENGINE_CONFIG.CONFIDENCE_WEIGHTS;
    const pathExecutability = isPathValid ? 1 : 0;

    const relatedIds = [];
    path.steps.forEach((step) => {
      const serviceId = this.extractServiceId(step.id);
      relatedIds.push(serviceId);
      graph.getIncomingEdges(serviceId).forEach((edge) => {
        relatedIds.push(edge.sourceId);
      });
    });

    const nodes = Array.from(new Set(relatedIds))
      .map((id) => graph.getNode(id))
      .filter(Boolean);

    if (nodes.length === 0) {
      return 0;
    }

    // Data completeness: share of expected fields that are filled.
    let totalFields = 0;
    let filledFields = 0;
    nodes.forEach((node) => {
      const fields =
        node.type !== 'SERVICE'
          ? ['documentNumber', 'expiryDate', 'isValid', 'verificationScore', 'lastVerifiedDate']
          : ['ministryName', 'estimatedFees', 'processingTime', 'onlineLink', 'verificationScore', 'lastVerifiedDate'];
      fields.forEach((field) => {
        totalFields = totalFields + 1;
        if (node[field] !== undefined && node[field] !== null && node[field] !== '') {
          filledFields = filledFields + 1;
        }
      });
    });
    const dataCompleteness = totalFields > 0 ? filledFields / totalFields : 1;

    // Rule reliability: mean verification score of the services.
    let scoreSum = 0;
    let serviceCount = 0;
    nodes.forEach((node) => {
      if (node.type === 'SERVICE') {
        scoreSum = scoreSum + (node.verificationScore || 75) / 100;
        serviceCount = serviceCount + 1;
      }
    });
    const ruleReliability = serviceCount > 0 ? scoreSum / serviceCount : 0.75;

    // Document validity: share of DOCUMENT nodes that are valid.
    let docTotal = 0;
    let docValid = 0;
    nodes.forEach((node) => {
      if (node.type === 'DOCUMENT') {
        docTotal = docTotal + 1;
        if (node.isValid) {
          docValid = docValid + 1;
        }
      }
    });
    const documentValidity = docTotal > 0 ? docValid / docTotal : 1;

    // Data recency: exponential decay by days since last verification.
    let recencySum = 0;
    let recencyCount = 0;
    const decayRate = ENGINE_CONFIG.DATA_RECENCY_DECAY_RATE;
    nodes.forEach((node) => {
      if (node.lastVerifiedDate) {
        const ageDays = Math.max(
          0,
          Math.ceil((referenceDate.getTime() - new Date(node.lastVerifiedDate).getTime()) / 86400000)
        );
        recencySum = recencySum + Math.exp(-decayRate * ageDays);
        recencyCount = recencyCount + 1;
      }
    });
    const dataRecency = recencyCount > 0 ? recencySum / recencyCount : 1;

    return Math.round(
      (weights.dataCompleteness * dataCompleteness +
        weights.ruleReliability * ruleReliability +
        weights.documentValidity * documentValidity +
        weights.pathExecutability * pathExecutability +
        weights.dataRecency * dataRecency) *
        100
    );
  }

  static extractServiceId(stepId) {
    let id = stepId.startsWith('step_') ? stepId.substring(5) : stepId;
    if (id.endsWith('_digital')) {
      return id.substring(0, id.length - 8);
    }
    if (id.endsWith('_in_person')) {
      return id.substring(0, id.length - 10);
    }
    return id;
  }
}
