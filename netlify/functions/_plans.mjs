// netlify/functions/_plans.mjs
// SINGLE SOURCE OF TRUTH for all plan definitions
// Import this in every function that needs plan data

export const PLANS = {
  scout: {
    name: "Scout", price_monthly: 0, price_annual: 0,
    rank: 0,
    features: {
      max_players: 10, ai_scores_per_month: 3,
      alerts: false, crm: false, whatsapp: false,
      analytics: false, api_access: false,
      notifications_email: false, notifications_telegram: false,
    },
  },
  agent: {
    name: "Agent", price_monthly: 39, price_annual: 29,
    rank: 1,
    features: {
      max_players: null, ai_scores_per_month: null,  // unlimited
      alerts: true, crm: true, whatsapp: false,
      analytics: false, api_access: false,
      notifications_email: true, notifications_telegram: true,
    },
  },
  director: {
    name: "Director", price_monthly: 99, price_annual: 79,
    rank: 2,
    features: {
      max_players: null, ai_scores_per_month: null,
      alerts: true, crm: true, whatsapp: true,
      analytics: true, api_access: false,
      notifications_email: true, notifications_telegram: true,
    },
  },
  executive: {
    name: "Executive", price_monthly: 249, price_annual: 199,
    rank: 3,
    features: {
      max_players: null, ai_scores_per_month: null,
      alerts: true, crm: true, whatsapp: true,
      analytics: true, api_access: true,
      notifications_email: true, notifications_telegram: true,
    },
  },
};

// Returns true if userPlan can use minPlan features
export function canUsePlan(userPlan, minPlan) {
  const rank = (p) => PLANS[p]?.rank ?? 0;
  return rank(userPlan) >= rank(minPlan);
}

// Returns plan features for a user's plan
export function getPlanFeatures(userPlan) {
  return PLANS[userPlan || 'scout']?.features || PLANS.scout.features;
}

// LemonSqueezy variant ID → plan name
export const LS_VARIANT_MAP = {
  // These are populated from env vars at runtime via ls-config.mjs
  // The keys are the LS variant IDs you get after creating products
};

export const PLAN_STATUSES = {
  ACTIVE:     'active',
  TRIAL:      'trialing',
  PAST_DUE:   'past_due',
  CANCELLED:  'cancelled',
  EXPIRED:    'expired',
  PAUSED:     'paused',
};

export function isActivePlan(status) {
  return ['active','trialing'].includes(status);
}
