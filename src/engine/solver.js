// Reconstructed from Metro module 728 (decompiled.js lines 279135–280368)
// PathFinder: builds candidate execution paths for a target service.
// ConstraintSolver: rejects paths that break eligibility / document-validity / cycle constraints.

import { ENGINE_CONFIG } from './utils';

// Which services "produce" (issue or renew) each document node.
const DOCUMENT_PRODUCERS = {
  doc_nid: ['service_moi_issue_nid', 'service_moi_update_nid'],
  doc_passport: ['service_moi_issue_passport', 'service_moi_renew_passport'],
  doc_driving: ['service_moi_issue_driving_license', 'service_moi_renew_driving_license'],
  doc_vehicle: ['service_moi_register_vehicle', 'service_moi_renew_vehicle_registration'],
};

export class PathFinder {
  static generatePaths(graph, targetServiceId) {
    const targetNode = graph.getNode(targetServiceId);
    if (!targetNode || targetNode.type !== 'SERVICE') {
      return [];
    }

    const visited = new Set();
    const dependencyEdges = []; // { from: prerequisiteServiceId, to: dependentServiceId }
    const missingDocs = []; // collected but never read afterwards

    const resolveDependencies = (serviceId) => {
      if (visited.has(serviceId)) {
        return;
      }
      visited.add(serviceId);
      if (!graph.getNode(serviceId)) {
        return;
      }

      for (const edge of graph.getIncomingEdges(serviceId)) {
        const sourceNode = graph.getNode(edge.sourceId);
        if (!sourceNode) {
          continue;
        }
        if (sourceNode.type !== 'DOCUMENT') {
          continue;
        }
        if (sourceNode.isValid) {
          continue;
        }

        missingDocs.push(sourceNode.id);
        for (const producerId of DOCUMENT_PRODUCERS[sourceNode.id] || []) {
          if (graph.getNode(producerId)) {
            dependencyEdges.push({ from: producerId, to: serviceId });
            resolveDependencies(producerId);
          }
        }
      }
    };

    resolveDependencies(targetServiceId);

    const createStep = (serviceId, channel) => {
      const node = graph.getNode(serviceId);
      const shortId = serviceId.replace('service_', '');
      let duration =
        ENGINE_CONFIG.STEP_DURATION_ESTIMATES[shortId] ||
        ENGINE_CONFIG.STEP_DURATION_ESTIMATES.default_step;
      const wait =
        node.bookingRequired && channel === 'digital'
          ? ENGINE_CONFIG.STEP_WAIT_ESTIMATES.appointment_needed
          : ENGINE_CONFIG.STEP_WAIT_ESTIMATES.normal_wait;
      duration = duration + wait;
      const probability = ENGINE_CONFIG.ELIGIBILITY_PROBABILITIES.has_all_required_docs;
      const requiredDocs = graph
        .getIncomingEdges(serviceId)
        .map((edge) => graph.getNode(edge.sourceId))
        .filter((n) => n.type === 'DOCUMENT')
        .map((n) => n.label);

      return {
        id: `step_${serviceId}_${channel}`,
        label: node.label,
        duration,
        probability,
        requiredDocs,
      };
    };

    const paths = [];

    // Path 1: digital-first (digital channel wherever the service has an online link).
    const digitalSteps = new Map();
    visited.forEach((serviceId) => {
      const channel = graph.getNode(serviceId).onlineLink ? 'digital' : 'in_person';
      digitalSteps.set(serviceId, createStep(serviceId, channel));
    });

    const sortedIds = this.topologicalSort(Array.from(visited), dependencyEdges);

    paths.push({
      id: `${targetServiceId}_digital_first`,
      description: 'مسار رقمي يمنح الأولوية للمعاملات الإلكترونية والحجز المسبق عبر بوابة أور.',
      steps: sortedIds.map((id) => digitalSteps.get(id)),
      channel: 'mixed',
    });

    // Path 2: everything in person.
    const inPersonSteps = new Map();
    visited.forEach((serviceId) => {
      inPersonSteps.set(serviceId, createStep(serviceId, 'in_person'));
    });

    paths.push({
      id: `${targetServiceId}_in_person`,
      description: 'مسار تقليدي يتم فيه مراجعة الدوائر الحكومية حضورياً لتقديم الطلبات.',
      steps: sortedIds.map((id) => inPersonSteps.get(id)),
      channel: 'in_person',
    });

    // Path 3: alternative ordering (only when there are more than 2 steps).
    if (sortedIds.length > 2) {
      const alternativeIds = [...sortedIds];
      const first = alternativeIds[0];
      const second = alternativeIds[1];

      const firstTwoDependent = dependencyEdges.some(
        (e) => (e.from === first && e.to === second) || (e.from === second && e.to === first)
      );

      if (!firstTwoDependent && first !== targetServiceId && second !== targetServiceId) {
        alternativeIds[0] = second;
        alternativeIds[1] = first;
      } else {
        const targetIndex = alternativeIds.indexOf(targetServiceId);
        if (targetIndex > 1) {
          alternativeIds.splice(0, targetIndex, ...alternativeIds.slice(0, targetIndex).reverse());
        }
      }

      paths.push({
        id: `${targetServiceId}_alternative`,
        description: 'مسار بديل يقدم ترتيباً مختلفاً لإنجاز المعاملات التمهيدية.',
        steps: alternativeIds.map((id) => digitalSteps.get(id)),
        channel: 'mixed',
      });
    }

    return paths;
  }

  // Depth-first topological sort: every `from` is placed before its `to`.
  // Back-edges (cycles) are silently ignored via the `visiting` set.
  static topologicalSort(nodeIds, edges) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (nodeId) => {
      if (visited.has(nodeId)) {
        return;
      }
      if (visiting.has(nodeId)) {
        return;
      }
      visiting.add(nodeId);
      const prerequisites = edges.filter((e) => e.to === nodeId).map((e) => e.from);
      for (const prerequisiteId of prerequisites) {
        visit(prerequisiteId);
      }
      visiting.delete(nodeId);
      visited.add(nodeId);
      sorted.push(nodeId);
    };

    for (const nodeId of nodeIds) {
      visit(nodeId);
    }
    return sorted;
  }
}

export class ConstraintSolver {
  static solveConstraints(graph, paths, startDateInput) {
    const startDate = new Date(startDateInput);

    return paths.map((path) => {
      const log = [];
      let isFeasible = true;
      let reason = undefined;

      // Constraint 1: no circular dependency between the path's steps.
      if (this.detectCycleInPath(graph, path)) {
        isFeasible = false;
        reason = 'تم استبعاد المسار لوجود حلقة اعتماد دائرية في تسلسل الخطوات.';
        log.push('فشل: حلقة اعتماد دائرية.');
      }

      // Constraint 2: every eligibility condition attached to a step must hold.
      if (isFeasible) {
        for (const step of path.steps) {
          const serviceId = this.extractServiceId(step.id);
          for (const edge of graph.getIncomingEdges(serviceId)) {
            const sourceNode = graph.getNode(edge.sourceId);
            if (!sourceNode || sourceNode.type !== 'ELIGIBILITY_CONDITION') {
              continue;
            }
            if (sourceNode.isValid !== false) {
              continue;
            }
            isFeasible = false;
            reason = 'تم استبعاد المسار لعدم استيفاء شرط الأهلية: ' + sourceNode.label;
            log.push('فشل: عدم استيفاء شرط الأهلية (' + sourceNode.label + ').');
            break;
          }
          if (!isFeasible) {
            break;
          }
        }
      }

      // Constraint 3: walk the steps in time; each required document must be valid
      // (or renewed by an earlier step) and must not expire before the step is reached.
      if (isFeasible) {
        let elapsedDays = 0;
        const renewedDocs = new Set();

        for (const step of path.steps) {
          const serviceId = this.extractServiceId(step.id);

          for (const edge of graph.getIncomingEdges(serviceId)) {
            const docNode = graph.getNode(edge.sourceId);
            if (!docNode || docNode.type !== 'DOCUMENT') {
              continue;
            }

            const wasRenewed = renewedDocs.has(docNode.id);
            const isDocValid = docNode.isValid === true;

            if (!isDocValid && !wasRenewed) {
              isFeasible = false;
              reason =
                'تم استبعاد المسار لأن المستند المطلوب (' +
                docNode.label +
                ') غير صالح أو مفقود ولم يتم إدراج خطوة لتجديده أولاً.';
              log.push('فشل: مستند مفقود/غير صالح بدون خطوة تجديد (' + docNode.label + ').');
              break;
            }

            if (isDocValid && !wasRenewed && docNode.expiryDate) {
              const expiry = new Date(docNode.expiryDate);
              const executionDate = new Date(startDate.getTime());
              executionDate.setDate(executionDate.getDate() + elapsedDays);
              if (executionDate.getTime() > expiry.getTime()) {
                isFeasible = false;
                reason =
                  'تم استبعاد المسار لأن المستند (' +
                  docNode.label +
                  ') سينتهي صلاحيته في تاريخ ' +
                  docNode.expiryDate +
                  ' قبل الوصول إلى خطوة ' +
                  step.label +
                  ' (تاريخ التنفيذ المتوقع: ' +
                  executionDate.toISOString().split('T')[0] +
                  ').';
                log.push('فشل: انتهاء صلاحية المستند (' + docNode.label + ') قبل التنفيذ.');
                break;
              }
            }
          }

          if (!isFeasible) {
            break;
          }

          this.getProducedDocuments(serviceId).forEach((docId) => renewedDocs.add(docId));
          elapsedDays = elapsedDays + step.duration;
        }
      }

      return {
        path,
        score: 0,
        metrics: {
          expectedTime: 0,
          acceptanceProbability: 0,
          delayRisk: 0,
          docCount: 0,
          crossImpact: 0,
        },
        isValid: isFeasible,
        reason,
        decisionExplanationLog: log.length > 0 ? log : ['تم استيفاء جميع القيود بنجاح.'],
      };
    });
  }

  // 'step_service_x_digital' -> 'service_x'
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

  static getProducedDocuments(serviceId) {
    const produced = [];
    for (const [docId, producers] of Object.entries(DOCUMENT_PRODUCERS)) {
      if (producers.includes(serviceId)) {
        produced.push(docId);
      }
    }
    return produced;
  }

  // Cycle = a step needs a DOCUMENT whose producer service is (transitively) also a step
  // that is already on the current DFS stack.
  static detectCycleInPath(graph, path) {
    const stepServiceIds = new Set(path.steps.map((step) => this.extractServiceId(step.id)));
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (serviceId) => {
      if (recursionStack.has(serviceId)) {
        return true;
      }
      if (visited.has(serviceId)) {
        return false;
      }
      visited.add(serviceId);
      recursionStack.add(serviceId);

      for (const edge of graph.getIncomingEdges(serviceId)) {
        const sourceNode = graph.getNode(edge.sourceId);
        if (!sourceNode || sourceNode.type !== 'DOCUMENT') {
          continue;
        }
        for (const producerId of DOCUMENT_PRODUCERS[sourceNode.id] || []) {
          if (stepServiceIds.has(producerId) && dfs(producerId)) {
            return true;
          }
        }
      }

      recursionStack.delete(serviceId);
      return false;
    };

    for (const serviceId of stepServiceIds) {
      if (dfs(serviceId)) {
        return true;
      }
    }
    return false;
  }
}
