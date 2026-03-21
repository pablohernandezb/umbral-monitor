// components/gaceta/gaceta-utils.ts
import type { GacetaChangeLabel, GacetaRecord, GacetaSummary } from '@/types';

// ── Label classification rules (first match wins) ──────────────
const TYPE_LABEL_RULES: Array<[RegExp, GacetaChangeLabel]> = [
  [/^DESIGNACION_/i, 'Designación'],
  [/^NOMBRAMIENTO_/i, 'Designación'],
  [/^ELECCION_/i, 'Designación'],
  [/^JUBILACION$/i, 'Jubilación'],
  [/^TRASLADO_/i, 'Traslado'],
  [/^SUPRESION_/i, 'Supresión'],
  [/^REORGANIZACION_/i, 'Reorganización'],
  [/^CREACION_/i, 'Reorganización'],
  [/^FUSION_/i, 'Reorganización'],
  [/^REVOCACION$/i, 'Revocación'],
  [/^LEY_/i, 'Ley'],
  [/^REFORMA_/i, 'Ley'],
  [/^AUTORIZACION_/i, 'Autorización'],
];

export function getLabelForChangeType(raw: string): GacetaChangeLabel {
  for (const [regex, label] of TYPE_LABEL_RULES) {
    if (regex.test(raw)) return label;
  }
  return 'Otro';
}

// ── Label colors ────────────────────────────────────────────────
export const LABEL_COLORS: Record<GacetaChangeLabel, string> = {
  'Designación':    '#3b82f6',  // blue
  'Jubilación':     '#22c55e',  // green
  'Traslado':       '#a855f7',  // purple
  'Supresión':      '#ef4444',  // red
  'Reorganización': '#14b8a6',  // teal
  'Revocación':     '#f59e0b',  // amber
  'Ley':            '#ec4899',  // pink
  'Autorización':   '#f97316',  // orange
  'Otro':           '#6b7280',  // gray
};

// ── Gazette URL ─────────────────────────────────────────────────
export function gazetteUrl(gazetteNumber: number): string {
  return `http://www.gacetaoficial.gob.ve/gacetas/${gazetteNumber}`;
}

// ── ISO week helpers ─────────────────────────────────────────────
function getISOWeek(dateStr: string): { week: string; label: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1 ... Sun=7
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + (4 - day));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekStr = `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  // Compute the Monday of this ISO week for a readable label
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));
  const label = monday.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });

  return { week: weekStr, label };
}

export function groupByWeek(records: GacetaRecord[]): { week: string; label: string; count: number }[] {
  const map = new Map<string, { label: string; count: number }>();
  for (const r of records) {
    if (!r.gazette_date) continue;
    const { week, label } = getISOWeek(r.gazette_date);
    const existing = map.get(week);
    if (existing) {
      existing.count++;
    } else {
      map.set(week, { label, count: 1 });
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { label, count }]) => ({ week, label, count }));
}

export function topOrganisms(records: GacetaRecord[], n = 8): { organism: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    if (!r.organism) continue;
    counts[r.organism] = (counts[r.organism] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([organism, count]) => ({ organism, count }));
}

// ── Summary computation ──────────────────────────────────────────
export function computeGacetaSummary(records: GacetaRecord[]): GacetaSummary {
  const allLabels: GacetaChangeLabel[] = [
    'Designación', 'Jubilación', 'Traslado', 'Supresión',
    'Reorganización', 'Revocación', 'Ley', 'Autorización', 'Otro',
  ];

  const changesByLabel = Object.fromEntries(allLabels.map((l) => [l, 0])) as Record<GacetaChangeLabel, number>;
  let militaryPersons = 0;
  let militaryPosts = 0;

  for (const r of records) {
    changesByLabel[r.change_label] = (changesByLabel[r.change_label] || 0) + 1;
    if (r.is_military_person) militaryPersons++;
    if (r.is_military_post) militaryPosts++;
  }

  const designations = changesByLabel['Designación'];
  const militaryPct = designations > 0
    ? Math.round((militaryPersons / designations) * 100)
    : 0;

  return {
    totalChanges: records.length,
    designations,
    militaryPersons,
    militaryPosts,
    militaryPct,
    changesByLabel,
    byOrganism: topOrganisms(records, 8),
    byWeek: groupByWeek(records),
  };
}
