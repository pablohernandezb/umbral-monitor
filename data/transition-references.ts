// Source documents behind the 60-action roadmap. This is a curated
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
  /** Link to the published source. Omitted (not guessed) until a real,
   * verified URL is supplied — renders no link icon until then. */
  url?: string
}

export const TRANSITION_REFERENCES: TransitionReference[] = [
  {
    id: 'quiero-elegir',
    title: 'Quiero Elegir — Camino para recuperar la democracia, la libertad y el estado de derecho',
    typeEs: 'Sociedad civil venezolana',
    typeEn: 'Venezuelan civil society',
    dateEs: 'Julio 2026',
    dateEn: 'July 2026',
    url: 'https://transparenciave.org/camino-para-recuperar-la-democracia-la-libertad-y-el-estado-de-derecho/',
  },
  {
    id: 'chatham-sabatini-farsari',
    title: 'Chatham House — The US plan for Venezuela won’t work without the rule of law. Here’s how to make progress (Sabatini & Farsari)',
    typeEs: 'Think tank / investigación',
    typeEn: 'Think tank / research',
    dateEs: 'Junio 2026',
    dateEn: 'June 2026',
    url: 'https://www.chathamhouse.org/2026/06/us-plan-venezuela-wont-work-without-rule-law-heres-how-make-progress/whats-problem',
  },
  {
    id: 'atlantic-council-framework',
    title: 'Atlantic Council — Updating the Democratic Transition Framework',
    typeEs: 'Think tank / investigación',
    typeEn: 'Think tank / research',
    dateEs: '2026',
    dateEn: '2026',
    url: 'https://www.atlanticcouncil.org/in-depth-research-reports/issue-brief/democratic-transition-framework-chart-forward-venezuela/',
  },
  {
    id: 'atlantic-council-memo',
    title: 'Atlantic Council — Memo to the President',
    typeEs: 'Think tank / política pública',
    typeEn: 'Think tank / public policy',
    dateEs: '2026',
    dateEn: '2026',
    url: 'https://www.atlanticcouncil.org/content-series/memo-to/the-president-steps-to-secure-a-prosperous-us-aligned-venezuela/'
  },
  {
    id: 'chatham-elections-overnight',
    title: 'Chatham House — Democratic elections in Venezuela won’t happen overnight (Sabatini)',
    typeEs: 'Think tank / investigación',
    typeEn: 'Think tank / research',
    dateEs: '2026',
    dateEn: '2026',
    url: 'https://www.chathamhouse.org/2026/04/democratic-elections-venezuela-wont-happen-overnight-heres-groundwork-thats-needed-first',
  },
  {
    id: 'ucm-libertad-prensa',
    title: 'Universidad Complutense de Madrid — Venezuela: transición y prensa. Hoja de ruta y reformas hacia la democracia.',
    typeEs: 'Universidad',
    typeEn: 'University',
    dateEs: '2026',
    dateEn: '2026',
    url: 'https://www.youtube.com/live/-EhybfoVEas'
  },
  {
    id: 'carmen-beatriz-fernandez',
    title: 'Documentos y hoja de ruta de Carmen Beatriz Fernández',
    typeEs: 'Propuesta de transición',
    typeEn: 'Transition proposal',
    dateEs: '2026',
    dateEn: '2026',
    url: 'https://e-lecciones.net/opinion/?id=1551'
  },
  {
    id: 'javier-corrales',
    title: 'Javier Corrales — Análisis sobre las transiciones',
    typeEs: 'Análisis académico',
    typeEn: 'Academic analysis',
    dateEs: '2026',
    dateEn: '2026',
    url: 'https://www.foreignaffairs.com/venezuela/venezuela-needs-regime-change-javier-corrales'
  },
  {
    id: 'lopre',
    title: 'República Bolivariana de Venezuela — LOPRE (Ley Orgánica de Procesos Electorales)',
    typeEs: 'Legal',
    typeEn: 'Legal',
    dateEs: '2009',
    dateEn: '2009',
    url: 'https://www.asambleanacional.gob.ve/leyes/sancionadas/ley-organica-de-procesos-electorales'
  },
]
