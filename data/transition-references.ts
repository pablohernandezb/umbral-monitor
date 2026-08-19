// Source documents behind the 62-action roadmap. This is a curated
// bibliography, not tracked data — it changes when we add a source, not on a
// schedule — so it lives here rather than in Supabase alongside the checklist.
//
// Titles are kept verbatim in their published language: they are the names of
// real works, and translating them would make them unfindable. `type` and
// `date` are our own descriptors, so those are bilingual.

export interface TransitionReference {
  id: string
  /** Verbatim, in the language the source was published in. */
  title: string
  typeEs: string
  typeEn: string
  /** Empty when the source carries no publication date (e.g. standing law). */
  dateEs: string
  dateEn: string
}

export const TRANSITION_REFERENCES: TransitionReference[] = [
  {
    id: 'quiero-elegir',
    title: 'Quiero Elegir — Camino para recuperar la democracia, la libertad y el estado de derecho',
    typeEs: 'Sociedad civil venezolana',
    typeEn: 'Venezuelan civil society',
    dateEs: 'Julio 2026',
    dateEn: 'July 2026',
  },
  {
    id: 'chatham-sabatini-farsari',
    title: 'Chatham House — Sabatini & Farsari',
    typeEs: 'Think tank / investigación',
    typeEn: 'Think tank / research',
    dateEs: 'Junio 2026',
    dateEn: 'June 2026',
  },
  {
    id: 'atlantic-council-framework',
    title: 'Atlantic Council — Updating the Democratic Transition Framework',
    typeEs: 'Think tank / investigación',
    typeEn: 'Think tank / research',
    dateEs: '2026',
    dateEn: '2026',
  },
  {
    id: 'atlantic-council-memo',
    title: 'Atlantic Council — Memo to the President',
    typeEs: 'Think tank / política pública',
    typeEn: 'Think tank / public policy',
    dateEs: '2026',
    dateEn: '2026',
  },
  {
    id: 'chatham-elections-overnight',
    title: 'Chatham House — Democratic elections in Venezuela won’t happen overnight',
    typeEs: 'Think tank / investigación',
    typeEn: 'Think tank / research',
    dateEs: '2026',
    dateEn: '2026',
  },
  {
    id: 'ucm-libertad-prensa',
    title: 'Universidad Complutense de Madrid — evento sobre libertad de prensa y transición',
    typeEs: 'Universidad',
    typeEn: 'University',
    dateEs: '2026',
    dateEn: '2026',
  },
  {
    id: 'carmen-beatriz-fernandez',
    title: 'Documentos y hoja de ruta de Carmen Beatriz Fernández',
    typeEs: 'Propuesta de transición',
    typeEn: 'Transition proposal',
    dateEs: '2026',
    dateEn: '2026',
  },
  {
    id: 'javier-corrales',
    title: 'Javier Corrales — análisis sobre la transición',
    typeEs: 'Análisis académico',
    typeEn: 'Academic analysis',
    dateEs: '2026',
    dateEn: '2026',
  },
  {
    id: 'lopre',
    title: 'LOPRE Ley Orgánica de Procesos Electorales',
    typeEs: 'Legal',
    typeEn: 'Legal',
    dateEs: '',
    dateEn: '',
  },
]
