/**
 * Single source of truth for pricing & plan limits.
 *
 * IMPORTANT: keep in sync with:
 *   - Stripe products (price IDs below)
 *   - supabase/functions/get-admin-metrics/index.ts (PRO_MONTHLY / AGENCY_MONTHLY)
 *   - supabase/functions/create-checkout-session/index.ts
 *
 * Currency: EUR (matches Stripe configuration). Do NOT show "lei" anywhere
 * in the UI — Stripe charges in EUR and our T&Cs reference EUR.
 */

export const CURRENCY = {
  code: 'EUR' as const,
  symbol: '€' as const,
};

export type PlanKey = 'free' | 'pro' | 'agency';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanPricing {
  monthly: { amount: number; stripePriceId?: string };
  yearly: { amount: number; stripePriceId?: string; monthlyEquivalent: number };
}

export const PLAN_PRICING: Record<PlanKey, PlanPricing> = {
  free: {
    monthly: { amount: 0 },
    yearly: { amount: 0, monthlyEquivalent: 0 },
  },
  pro: {
    monthly: { amount: 19, stripePriceId: 'price_1TJugbGov5n78hOqT1YD3MGq' },
    yearly: { amount: 190, stripePriceId: 'price_1TJugbGov5n78hOqQwPK03Ss', monthlyEquivalent: 15.83 },
  },
  agency: {
    monthly: { amount: 49, stripePriceId: 'price_1TJugcGov5n78hOqYt34TN96' },
    yearly: { amount: 490, stripePriceId: 'price_1TJugdGov5n78hOqlGVni8yJ', monthlyEquivalent: 40.83 },
  },
};

/**
 * Plan feature limits. Single source of truth — keep gates and pricing UI aligned.
 */
export const PLAN_LIMITS = {
  free: {
    platformsConnected: 1,           // matches FREE_PLATFORMS in Platforms.tsx (youtube only)
    recommendationsVisiblePerDay: 1, // matches FREE_VISIBLE_COUNT in Recommendations.tsx
    analyticsHistoryDays: 7,
    aiChatMessagesPerDay: 0,
  },
  pro: {
    platformsConnected: 5,
    recommendationsVisiblePerDay: Infinity,
    analyticsHistoryDays: 90,
    aiChatMessagesPerDay: 50,
  },
  agency: {
    platformsConnected: Infinity,
    recommendationsVisiblePerDay: Infinity,
    analyticsHistoryDays: 365,
    aiChatMessagesPerDay: 200,
  },
} as const;

/**
 * Format a price in our canonical currency (EUR).
 * Uses simple template (e.g. "€19") — no Intl overhead, predictable in SSR/snapshots.
 */
export function formatPrice(amount: number, opts?: { withSuffix?: boolean }): string {
  const formatted =
    Number.isInteger(amount) ? `${CURRENCY.symbol}${amount}` : `${CURRENCY.symbol}${amount.toFixed(2)}`;
  return opts?.withSuffix ? `${formatted}/lună` : formatted;
}

/**
 * Helper for "Pro (€19/lună)" style copy — pass plan key + cycle.
 */
export function planPriceLabel(plan: PlanKey, cycle: BillingCycle = 'monthly'): string {
  const p = PLAN_PRICING[plan];
  const amount = cycle === 'yearly' ? p.yearly.monthlyEquivalent : p.monthly.amount;
  return formatPrice(amount, { withSuffix: true });
}

/**
 * Calculate the discount % of yearly vs monthly (rounded). Returns 0 for free.
 */
export function yearlyDiscountPercent(plan: PlanKey): number {
  const p = PLAN_PRICING[plan];
  if (p.monthly.amount === 0) return 0;
  return Math.round((1 - p.yearly.amount / (p.monthly.amount * 12)) * 100);
}
