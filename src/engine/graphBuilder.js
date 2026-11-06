// Reconstructed from Metro module 726 (decompiled.js lines 278134–278508)
// Turns the normalised engine input (documents + services) into a CausalTemporalGraph.

import { CausalTemporalGraph } from './Graph';

export class ProceduralGraphBuilder {
  static build(input) {
    const graph = new CausalTemporalGraph();

    // 1) One DOCUMENT node + one DEADLINE node per document the user holds.
    input.documents.forEach((doc) => {
      const docId = `doc_${doc.type}`;
      const deadlineId = `deadline_${doc.type}`;

      graph.addNode({
        id: docId,
        type: 'DOCUMENT',
        label: doc.label,
        isValid: doc.isValid,
        documentNumber: doc.documentNumber,
        expiryDate: doc.expiryDate,
        lastVerifiedDate: new Date().toISOString().split('T')[0],
        verificationScore: 90,
      });

      graph.addNode({
        id: deadlineId,
        type: 'DEADLINE',
        label: `تاريخ انتهاء ${doc.label}`,
        expiryDate: doc.expiryDate,
        isValid: doc.isValid,
      });

      graph.addEdge(deadlineId, docId, 'TEMPORAL_SEQUENCE');
    });

    // 2) One SERVICE node per service, wired to its required documents and conditions.
    input.services.forEach((service) => {
      const serviceNodeId = `service_${service.service_id}`;

      graph.addNode({
        id: serviceNodeId,
        type: 'SERVICE',
        label: service.service_name_ar,
        isValid: true,
        category: service.category,
        ministryName: service.ministry_name,
        estimatedFees: service.estimated_fees_iqd,
        processingTime: service.expected_processing_time,
        onlineLink: service.online_service_link,
        bookingRequired: service.booking_required,
        verificationScore: service.verification_score || 75,
        lastVerifiedDate: service.last_verified_date || new Date().toISOString().split('T')[0],
      });

      service.required_documents.forEach((docText, index) => {
        const docType = this.mapDocumentTextToType(docText);
        if (docType) {
          const docId = `doc_${docType}`;
          // Computed but never used in the original bundle.
          const causalImpactId = `causal_impact_${service.service_id}_${docType}`; // eslint-disable-line no-unused-vars
          graph.addEdge(docId, serviceNodeId, 'DOCUMENTARY_DEPENDENCY');
          graph.addEdge(`deadline_${docType}`, serviceNodeId, 'CAUSAL_INFLUENCE');
        }
      });

      service.eligibility_conditions.forEach((conditionText, index) => {
        const conditionId = `cond_${service.service_id}_${index}`;
        const conditionNode = {
          id: conditionId,
          type: 'ELIGIBILITY_CONDITION',
          label: conditionText,
          isValid: true,
        };

        if (conditionText.includes('سن') || conditionText.includes('عمر')) {
          const match = conditionText.match(/\d+/);
          if (match) {
            conditionNode.ageRequirement = parseInt(match[0]);
            if (input.userAge !== undefined) {
              conditionNode.isValid = input.userAge >= conditionNode.ageRequirement;
            }
          }
        }

        graph.addNode(conditionNode);
        graph.addEdge(conditionId, serviceNodeId, 'DOCUMENTARY_DEPENDENCY');
      });
    });

    return graph;
  }

  static mapDocumentTextToType(text) {
    const lower = text.toLowerCase();
    if (
      lower.includes('الوطنية') ||
      lower.includes('جنسية') ||
      lower.includes('موحدة') ||
      lower.includes('الأحوال')
    ) {
      return 'nid';
    }
    if (lower.includes('جواز') || lower.includes('باسبورت')) {
      return 'passport';
    }
    if (lower.includes('سكن')) {
      return 'housing';
    }
    if (lower.includes('تموينية')) {
      return 'ration';
    }
    if (lower.includes('إجازة سوق') || lower.includes('رخصة قيادة') || lower.includes('سياقة')) {
      return 'driving';
    }
    if (
      lower.includes('سنوية') ||
      lower.includes('سنويه') ||
      lower.includes('مركبة') ||
      lower.includes('تسجيل مركبة')
    ) {
      return 'vehicle';
    }
    return null;
  }
}
