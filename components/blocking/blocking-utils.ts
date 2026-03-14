// components/blocking/blocking-utils.ts
// Shared constants, color maps, and helpers for the domain blocking dashboard

export const PROVIDERS = [
  'CANTV', 'Movistar', 'Digitel', 'Inter', 'Netuno', 'Airtek', 'G-Network',
] as const;

export type ISPProvider = (typeof PROVIDERS)[number];

export const PROVIDER_DB_KEYS: Record<string, string> = {
  CANTV: 'cantv',
  Movistar: 'movistar',
  Digitel: 'digitel',
  Inter: 'inter',
  Netuno: 'netuno',
  Airtek: 'airtek',
  'G-Network': 'g_network',
};

export const BLOCK_TYPES = ['ok', 'DNS', 'TCP IP', 'HTTP/HTTPS'] as const;

export const BLOCK_TYPE_COLORS: Record<string, string> = {
  ok: '#22c55e',
  DNS: '#3b82f6',
  'TCP IP': '#ef4444',
  'HTTP/HTTPS': '#f59e0b',
};

export const CATEGORY_COLORS: Record<string, string> = {
  NEWS: '#3b82f6',
  ANON: '#a855f7',
  COMM: '#f59e0b',
  POLR: '#ef4444',
  HUMR: '#14b8a6',
  GRP: '#ec4899',
  PORN: '#71717a',
  ECON: '#22c55e',
  MMED: '#06b6d4',
  COMT: '#f97316',
  PUBH: '#84cc16',
  HATE: '#64748b',
};

/** Normalize individual block method tokens to canonical form */
export function normalizeBlockType(raw: string): string {
  if (raw === 'ok') return 'ok';
  if (raw === 'HTTPS' || raw === 'HTTP') return 'HTTP/HTTPS';
  return raw;
}

/** Split a compound blocking value (e.g. "DNS+TCP IP") into normalized tokens */
export function normalizeBlockTypes(value: string): string[] {
  if (value === 'ok') return ['ok'];
  return [...new Set(value.split('+').map(normalizeBlockType))];
}

/** Map a display provider name to its database column key */
export function providerToKey(provider: string): string {
  return PROVIDER_DB_KEYS[provider] || provider.toLowerCase();
}

/** Get the blocking value for a provider from a domain row (handles both DB and raw formats) */
export function getProviderValue(
  row: Record<string, string>,
  provider: string
): string {
  // Try DB key first (lowercase/snake_case), then raw name
  return row[providerToKey(provider)] ?? row[provider] ?? 'ok';
}

/** Compute summary metrics from the full dataset */
export function computeMetrics(data: Record<string, string>[]) {
  const total = data.length;
  const blocked = data.filter((d) =>
    PROVIDERS.some((p) => getProviderValue(d, p) !== 'ok')
  ).length;
  return {
    totalDomains: total,
    blockedDomains: blocked,
    blockingRate: total > 0 ? Math.round((blocked / total) * 100) : 0,
    providerCount: PROVIDERS.length,
  };
}

/** Build per-provider percentage breakdown for the stacked bar chart */
export function buildProviderBreakdown(
  data: Record<string, string>[],
  filterCategory?: string | null
) {
  let filtered = data;
  if (filterCategory)
    filtered = filtered.filter((d) => d.category === filterCategory);

  return PROVIDERS.map((provider) => {
    const counts: Record<string, number> = {};
    BLOCK_TYPES.forEach((bt) => (counts[bt] = 0));

    // Use fractional counts: a compound "DNS+TCP IP" domain contributes 0.5 to each type
    filtered.forEach((d) => {
      const value = getProviderValue(d, provider);
      if (value === 'ok') {
        counts['ok']++;
        return;
      }
      const types = normalizeBlockTypes(value).filter((t) => t !== 'ok');
      const share = 1 / types.length;
      types.forEach((t) => {
        if (counts[t] !== undefined) counts[t] += share;
      });
    });

    const total = filtered.length || 1;

    // Compute integer percentages and fix rounding so they sum to exactly 100
    const rawPcts = BLOCK_TYPES.map((bt) => ({
      bt,
      pct: (counts[bt] / total) * 100,
    }));
    const floored = rawPcts.map(({ bt, pct }) => ({
      bt,
      val: Math.floor(pct),
      rem: pct - Math.floor(pct),
    }));
    let remainder = 100 - floored.reduce((s, f) => s + f.val, 0);
    floored
      .sort((a, b) => b.rem - a.rem)
      .forEach((f) => {
        if (remainder > 0) { f.val++; remainder--; }
      });
    const pcts: Record<string, number> = {};
    floored.forEach(({ bt, val }) => (pcts[bt] = val));

    return { provider, counts, percentages: pcts, total };
  });
}
