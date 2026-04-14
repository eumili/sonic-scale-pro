import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Central hook for reading the current user's subscription plan.
 *
 * Source of truth: `public.profiles.plan` (values: 'free' | 'starter' | 'pro' | 'growth' | 'agency').
 * The Stripe webhook (`supabase/functions/stripe-webhook`) writes to this column.
 * DO NOT introduce a second column name (e.g. `subscription_tier`) — previous code read a
 * non-existent column and treated all users as Free, including paid ones.
 */
export type PlanTier = 'free' | 'starter' | 'pro' | 'growth' | 'agency';

interface UsePlanResult {
  plan: PlanTier | null;
  isFree: boolean;
  isPro: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanTier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const load = async () => {
    if (!user) {
      setPlan(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      // Fail-closed: treat as Free on error so we don't accidentally unlock Pro features.
      setPlan('free');
    } else {
      setPlan(((data?.plan as PlanTier | undefined) ?? 'free'));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Free tiers: no plan row, 'free', or 'starter' (trial — not a paid Pro tier).
  const isFree = !plan || plan === 'free' || plan === 'starter';
  // Pro tiers: paid plans that unlock gated features.
  const isPro = plan === 'pro' || plan === 'growth' || plan === 'agency';

  return { plan, isFree, isPro, isLoading, refresh: load };
}
