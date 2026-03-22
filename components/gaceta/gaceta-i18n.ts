// components/gaceta/gaceta-i18n.ts
// Translation dictionaries for gazette record fields (Spanish → English)

import type { GacetaRecord } from '@/types';

/** Exact-match dictionaries — keys are the Spanish DB values */

const ORGANISM_EN: Record<string, string> = {
  'Ministerio del Poder Popular para la Defensa': 'Ministry of Popular Power for Defense',
  'Ministerio del Poder Popular para Relaciones Interiores, Justicia y Paz': 'Ministry of Popular Power for Interior Relations, Justice and Peace',
  'Ministerio del Poder Popular para Relaciones Exteriores': 'Ministry of Popular Power for Foreign Affairs',
  'Ministerio del Poder Popular de Economía y Finanzas': 'Ministry of Popular Power for Economy and Finance',
  'Ministerio del Poder Popular para la Educación': 'Ministry of Popular Power for Education',
  'Ministerio del Poder Popular para la Educación Universitaria': 'Ministry of Popular Power for University Education',
  'Ministerio del Poder Popular para la Salud': 'Ministry of Popular Power for Health',
  'Ministerio del Poder Popular para la Agricultura y Tierras': 'Ministry of Popular Power for Agriculture and Lands',
  'Ministerio del Poder Popular para el Petróleo': 'Ministry of Popular Power for Petroleum',
  'Ministerio del Poder Popular para la Alimentación': 'Ministry of Popular Power for Food',
  'Ministerio del Poder Popular para el Transporte': 'Ministry of Popular Power for Transportation',
  'Ministerio del Poder Popular para Ciencia y Tecnología': 'Ministry of Popular Power for Science and Technology',
  'Ministerio del Poder Popular para el Trabajo y Seguridad Social': 'Ministry of Popular Power for Labor and Social Security',
  'Ministerio del Poder Popular para la Cultura': 'Ministry of Popular Power for Culture',
  'Ministerio del Poder Popular para el Deporte': 'Ministry of Popular Power for Sports',
  'Ministerio del Poder Popular para la Vivienda y Hábitat': 'Ministry of Popular Power for Housing and Habitat',
  'Ministerio del Poder Popular para Ecosocialismo': 'Ministry of Popular Power for Ecosocialism',
  'Ministerio del Poder Popular para las Comunas': 'Ministry of Popular Power for Communes',
  'Ministerio del Poder Popular para la Juventud': 'Ministry of Popular Power for Youth',
  'Ministerio del Poder Popular para la Mujer e Igualdad de Género': 'Ministry of Popular Power for Women and Gender Equality',
  'Ministerio del Poder Popular de Industrias y Producción Nacional': 'Ministry of Popular Power for Industries and National Production',
  'Ministerio del Poder Popular para el Turismo': 'Ministry of Popular Power for Tourism',
  'Ministerio Público': 'Public Prosecutor\'s Office',
  'Presidencia de la República': 'Presidency of the Republic',
  'Vicepresidencia de la República': 'Vice Presidency of the Republic',
  'Asamblea Nacional': 'National Assembly',
  'Tribunal Supremo de Justicia': 'Supreme Court of Justice',
  'Contraloría General de la República': 'Comptroller General of the Republic',
  'Defensoría del Pueblo': 'Ombudsman\'s Office',
  'Consejo Nacional Electoral': 'National Electoral Council',
  'Banco Central de Venezuela': 'Central Bank of Venezuela',
  'Petróleos de Venezuela S.A.': 'Petróleos de Venezuela S.A.',
  'Comités Locales de Abastecimiento y Producción': 'Local Supply and Production Committees',
  'Fuerza Armada Nacional Bolivariana': 'Bolivarian National Armed Forces',
  'Guardia Nacional Bolivariana': 'Bolivarian National Guard',
  'SENCAMER': 'SENCAMER',
};

const POSITION_EN: Record<string, string> = {
  'Ministro de Defensa': 'Minister of Defense',
  'Ministra de Defensa': 'Minister of Defense',
  'Vicepresidenta Ejecutiva': 'Executive Vice President',
  'Vicepresidente Ejecutivo': 'Executive Vice President',
  'Presidente de la Asamblea Nacional': 'President of the National Assembly',
  'Presidenta de la Asamblea Nacional': 'President of the National Assembly',
  'Fiscal General de la República': 'Attorney General of the Republic',
  'Presidenta del Tribunal Supremo de Justicia': 'President of the Supreme Court of Justice',
  'Presidente del Tribunal Supremo de Justicia': 'President of the Supreme Court of Justice',
  'Director del CLAP': 'Director of CLAP',
  'Directora del CLAP': 'Director of CLAP',
  'Presidente de PDVSA': 'President of PDVSA',
  'Presidenta de PDVSA': 'President of PDVSA',
  'Contralor General de la República': 'Comptroller General of the Republic',
  'Defensor del Pueblo': 'Ombudsman',
  'Defensora del Pueblo': 'Ombudsman',
  'Director General': 'Director General',
  'Directora General': 'Director General',
  'Directora de Educación': 'Director of Education',
  'Director de Educación': 'Director of Education',
  'Coordinador Regional': 'Regional Coordinator',
  'Coordinadora Regional': 'Regional Coordinator',
  'Magistrada Suplente': 'Substitute Justice',
  'Magistrado Suplente': 'Substitute Justice',
};

const MILITARY_RANK_EN: Record<string, string> = {
  'General en Jefe': 'General-in-Chief',
  'Almirante': 'Admiral',
  'Almirante en Jefe': 'Admiral-in-Chief',
  'General de División': 'Major General',
  'General de Brigada': 'Brigadier General',
  'Vicealmirante': 'Vice Admiral',
  'Contralmirante': 'Rear Admiral',
  'Coronel': 'Colonel',
  'Teniente Coronel': 'Lieutenant Colonel',
  'Mayor': 'Major',
  'Capitán': 'Captain',
  'Capitán de Navío': 'Captain (Navy)',
  'Capitán de Fragata': 'Commander (Navy)',
  'Capitán de Corbeta': 'Lieutenant Commander (Navy)',
  'Teniente': 'Lieutenant',
  'Teniente de Navío': 'Lieutenant (Navy)',
};

const GAZETTE_TYPE_EN: Record<string, string> = {
  'Ordinaria': 'Ordinary',
  'Extraordinaria': 'Extraordinary',
};

/** Pattern-based translations for organisms matching common prefixes */
const ORGANISM_PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Gobernación del estado (.+)$/, (m) => `${m[1]} State Government`],
  [/^Alcaldía del? (?:municipio )?(.+)$/, (m) => `Municipality of ${m[1]}`],
];

/** Pattern-based translations for positions */
const POSITION_PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Embajador(?:a)? en (.+)$/, (m) => `Ambassador to ${m[1]}`],
  [/^Gobernador(?:a)? del estado (.+)$/, (m) => `Governor of ${m[1]} State`],
  [/^Fiscal Superior del? (.+)$/, (m) => `Superior Prosecutor of ${m[1]}`],
  [/^Presidente del? (.+)$/, (m) => `President of ${m[1]}`],
  [/^Presidenta del? (.+)$/, (m) => `President of ${m[1]}`],
  [/^Director(?:a)? del? (.+)$/, (m) => `Director of ${m[1]}`],
  [/^Ministro del? (.+)$/, (m) => `Minister of ${m[1]}`],
  [/^Ministra del? (.+)$/, (m) => `Minister of ${m[1]}`],
  [/^Viceministro del? (.+)$/, (m) => `Vice Minister of ${m[1]}`],
  [/^Viceministra del? (.+)$/, (m) => `Vice Minister of ${m[1]}`],
];

/** Summary keyword translations */
const SUMMARY_TERMS: Array<[RegExp, string]> = [
  [/^Designación como /i, 'Appointed as '],
  [/^Designado como /i, 'Appointed as '],
  [/^Designada como /i, 'Appointed as '],
  [/^Designado /i, 'Appointed '],
  [/^Designada /i, 'Appointed '],
  [/^Ratificad[oa] como /i, 'Ratified as '],
  [/^Ratificad[oa] /i, 'Ratified '],
  [/^Elect[oa] /i, 'Elected '],
  [/^Traslado de /i, 'Transfer from '],
  [/^Jubilación aprobada con (\d+) años de servicio/i, 'Retirement approved with $1 years of service'],
  [/^Jubilación aprobada/i, 'Retirement approved'],
  [/^Autorización de funcionamiento/i, 'Operating authorization'],
  [/^Autorización para /i, 'Authorization for '],
  [/^Decreto de reorganización administrativa/i, 'Administrative reorganization decree'],
  [/^Resolución sobre /i, 'Resolution on '],
  [/^Resolución de /i, 'Resolution for '],
  [/^Supresión del? /i, 'Suppression of '],
  [/^Creación del? /i, 'Creation of '],
];

function translateWithDict(value: string, dict: Record<string, string>): string | null {
  return dict[value] ?? null;
}

function translateWithPatterns(value: string, patterns: Array<[RegExp, (match: RegExpMatchArray) => string]>): string | null {
  for (const [re, fn] of patterns) {
    const m = value.match(re);
    if (m) return fn(m);
  }
  return null;
}

/**
 * Translate a gazette field value to English. Returns the original if no translation found.
 */
export function tgField(
  field: 'organism' | 'post_or_position' | 'military_rank' | 'gazette_type' | 'summary',
  value: string | null,
  locale: string,
): string | null {
  if (!value || locale === 'es') return value;

  switch (field) {
    case 'organism':
      return translateWithDict(value, ORGANISM_EN)
        ?? translateWithPatterns(value, ORGANISM_PATTERNS)
        ?? value;
    case 'post_or_position':
      return translateWithDict(value, POSITION_EN)
        ?? translateWithPatterns(value, POSITION_PATTERNS)
        ?? value;
    case 'military_rank':
      return translateWithDict(value, MILITARY_RANK_EN) ?? value;
    case 'gazette_type':
      return translateWithDict(value, GAZETTE_TYPE_EN) ?? value;
    case 'summary': {
      for (const [re, replacement] of SUMMARY_TERMS) {
        if (re.test(value)) return value.replace(re, replacement);
      }
      return value;
    }
    default:
      return value;
  }
}

/**
 * Hook-friendly helper: returns a function that translates gazette fields.
 * Usage: const tg = useGacetaLocale(locale); tg('organism', record.organism)
 */
export function createGacetaTranslator(locale: string) {
  return (field: 'organism' | 'post_or_position' | 'military_rank' | 'gazette_type' | 'summary', value: string | null) =>
    tgField(field, value, locale);
}
