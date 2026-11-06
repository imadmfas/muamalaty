// Reconstructed from Metro module 729 (decompiled.js lines 280368–280405)
// Static tuning constants for the "digital procedural twin" engine.

export const ENGINE_CONFIG = {
  HORIZON_WINDOW_DAYS: 30,
  DEFAULT_CAUSAL_DEPTH: 3,
  STEP_DURATION_ESTIMATES: {
    moi_issue_passport: 5,
    moi_renew_passport: 3,
    moi_issue_nid: 14,
    moi_update_nid: 10,
    moi_transfer_records: 60,
    moi_residency_permit: 10,
    moi_issue_driving_license: 2,
    moi_renew_driving_license: 1,
    moi_register_vehicle: 4,
    moi_transfer_vehicle_ownership: 2,
    moi_renew_vehicle_registration: 1,
    default_step: 3,
  },
  STEP_WAIT_ESTIMATES: {
    appointment_needed: 5,
    normal_wait: 2,
  },
  ELIGIBILITY_PROBABILITIES: {
    has_all_required_docs: 0.95,
    missing_required_docs: 0.1,
    has_optional_docs: 1,
    age_requirement_met: 1,
    age_requirement_unmet: 0,
    default_probability: 0.9,
  },
  PATH_OBJECTIVE_WEIGHTS: {
    time: 0.25,
    probability: 0.25,
    delayRisk: 0.2,
    docCount: 0.15,
    crossImpact: 0.15,
  },
  CONFIDENCE_WEIGHTS: {
    dataCompleteness: 0.25,
    ruleReliability: 0.25,
    documentValidity: 0.2,
    pathExecutability: 0.15,
    dataRecency: 0.15,
  },
  DATA_RECENCY_DECAY_RATE: 0.001,
};
