// ============================================================
// Venezuela States — IODA region code mappings
// IODA region codes 4482–4506, mapped to state names
// GeoJSON geometry lives in data/venezuela-geo.json
// ============================================================

export interface VenezuelaState {
  code: string       // IODA numeric region code
  name: string       // State name in Spanish (matches GeoJSON shapeName)
  nameEn: string     // State name in English
  iodaCode: string   // IODA entity code (e.g., "4482")
}

export const VENEZUELA_STATES: VenezuelaState[] = [
  { code: '4482', name: 'Falcón', nameEn: 'Falcón', iodaCode: '4482' },
  { code: '4483', name: 'Apure', nameEn: 'Apure', iodaCode: '4483' },
  { code: '4484', name: 'Barinas', nameEn: 'Barinas', iodaCode: '4484' },
  { code: '4485', name: 'Mérida', nameEn: 'Mérida', iodaCode: '4485' },
  { code: '4486', name: 'Táchira', nameEn: 'Táchira', iodaCode: '4486' },
  { code: '4487', name: 'Trujillo', nameEn: 'Trujillo', iodaCode: '4487' },
  { code: '4488', name: 'Zulia', nameEn: 'Zulia', iodaCode: '4488' },
  { code: '4489', name: 'Cojedes', nameEn: 'Cojedes', iodaCode: '4489' },
  { code: '4490', name: 'Carabobo', nameEn: 'Carabobo', iodaCode: '4490' },
  { code: '4491', name: 'Lara', nameEn: 'Lara', iodaCode: '4491' },
  { code: '4492', name: 'Portuguesa', nameEn: 'Portuguesa', iodaCode: '4492' },
  { code: '4493', name: 'Yaracuy', nameEn: 'Yaracuy', iodaCode: '4493' },
  { code: '4494', name: 'Amazonas', nameEn: 'Amazonas', iodaCode: '4494' },
  { code: '4495', name: 'Bolívar', nameEn: 'Bolívar', iodaCode: '4495' },
  { code: '4496', name: 'Anzoátegui', nameEn: 'Anzoátegui', iodaCode: '4496' },
  { code: '4497', name: 'Aragua', nameEn: 'Aragua', iodaCode: '4497' },
  { code: '4498', name: 'La Guaira', nameEn: 'La Guaira', iodaCode: '4498' },
  { code: '4499', name: 'Distrito Capital', nameEn: 'Capital District', iodaCode: '4499' },
  { code: '4500', name: 'Dependencias Federales', nameEn: 'Federal Dependencies', iodaCode: '4500' },
  { code: '4501', name: 'Guárico', nameEn: 'Guárico', iodaCode: '4501' },
  { code: '4502', name: 'Monagas', nameEn: 'Monagas', iodaCode: '4502' },
  { code: '4503', name: 'Miranda', nameEn: 'Miranda', iodaCode: '4503' },
  { code: '4504', name: 'Nueva Esparta', nameEn: 'Nueva Esparta', iodaCode: '4504' },
  { code: '4505', name: 'Sucre', nameEn: 'Sucre', iodaCode: '4505' },
  { code: '4506', name: 'Delta Amacuro', nameEn: 'Delta Amacuro', iodaCode: '4506' },
]

/** Lookup map: IODA code → state */
export const STATES_BY_CODE = new Map(
  VENEZUELA_STATES.map((s) => [s.code, s])
)

/** Lookup map: GeoJSON shapeName → IODA code (for matching GeoJSON features to IODA data) */
export const IODA_CODE_BY_NAME = new Map(
  VENEZUELA_STATES.map((s) => [s.name, s.code])
)
