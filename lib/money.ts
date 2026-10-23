// Money is integer minor units (paise). All split math lives here and must
// always reconcile exactly to the expense amount — no lost paise.

export function toMinor(rupees: number): number {
  return Math.round(rupees * 100);
}
export function toMajor(minor: number): number {
  return minor / 100;
}
export function formatMoney(minor: number, currency = "INR"): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const s = (abs / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === "INR" ? "₹" : currency + " ";
  return `${sign}${symbol}${s}`;
}

/**
 * Split `amount` (minor) equally across `n` people. Distributes the remainder
 * one paisa at a time to the earliest people so the parts sum to `amount`.
 */
export function splitEqually(amount: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(amount / n);
  let remainder = amount - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Split by integer weights (shares). owed_i = round(amount * w_i / Σw), with
 * the rounding remainder pushed onto the largest-weight row so Σ = amount.
 */
export function splitByShares(amount: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => Math.floor((amount * w) / total));
  let used = raw.reduce((a, b) => a + b, 0);
  let remainder = amount - used;
  // give leftover paise to the biggest weights first
  const order = weights
    .map((w, i) => ({ w, i }))
    .sort((a, b) => b.w - a.w)
    .map((x) => x.i);
  for (let k = 0; remainder > 0; k = (k + 1) % order.length) {
    raw[order[k]] += 1;
    remainder -= 1;
  }
  return raw;
}

/** Percent split: percents in whole/decimal numbers that must sum to 100. */
export function splitByPercent(amount: number, percents: number[]): number[] {
  // scale percents to integer weights (x100) so 33.33 works, then reuse shares
  const weights = percents.map((p) => Math.round(p * 100));
  return splitByShares(amount, weights);
}

export type Share = { userId: string; paidMinor: number; owedMinor: number };

/** Validate that an expense's shares reconcile to its amount. */
export function sharesBalance(amount: number, shares: Share[]): string | null {
  const paid = shares.reduce((a, s) => a + s.paidMinor, 0);
  const owed = shares.reduce((a, s) => a + s.owedMinor, 0);
  if (paid !== amount) return `Payments add up to ${paid}, not ${amount}.`;
  if (owed !== amount) return `Shares add up to ${owed}, not ${amount}.`;
  return null;
}
