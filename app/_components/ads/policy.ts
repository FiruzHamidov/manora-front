const BUY_LIST_STEP_AB_KEY = 'aura_ads_buy_list_step_ab';

const BUY_STEPS = [10, 12] as const;

export function getBuyListAdStep(): number {
  if (typeof window === 'undefined') return BUY_STEPS[0];

  const raw = window.localStorage.getItem(BUY_LIST_STEP_AB_KEY);
  if (raw === '10' || raw === '12') return Number(raw);

  const assigned = Math.random() < 0.5 ? BUY_STEPS[0] : BUY_STEPS[1];
  window.localStorage.setItem(BUY_LIST_STEP_AB_KEY, String(assigned));
  return assigned;
}

export function reserveSessionAdSlot(): boolean {
  return true;
}
