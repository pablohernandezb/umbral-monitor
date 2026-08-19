// Body copy for the "Installing Democracy" methodology panel, transcribed from
// others/MetodoInstallingDemocracy.docx.
//
// Stored as structured blocks rather than an HTML blob so the panel can style
// headings, lists and the status key with the site's own design tokens, and so
// inline links stay real React elements instead of dangerouslySetInnerHTML.
//
// LANGUAGE: the source document is Spanish; every block's `en` slot below is a
// faithful English translation added afterward — pickCopy() in
// MethodologyPanel still falls back to Spanish if an `en` slot is ever left
// empty on a future edit, so a partial update never renders blank.

/** A run of text, optionally a link. `anchor` targets an id inside the panel. */
export type MethodologyInline =
  | string
  | { text: string; href: string }
  | { text: string; anchor: string }

export interface MethodologyStatusItem {
  tone: 'completed' | 'inProgress' | 'pending' | 'unrated'
  labelEs: string
  labelEn?: string
  /** Empty for "No evaluable", which has no percentage band. */
  rangeEs: string
  rangeEn?: string
  bodyEs: string
  bodyEn?: string
}

/** A pillar chip: the document's own wording plus the glyph to show with it. */
export interface MethodologyChip {
  /**
   * Key into PILLAR_ICONS. The document groups the tracker's 19 pillars into 11
   * broader areas, so one chip can stand for more than one pillar — the icon is
   * chosen for the leading concept in the label.
   */
  icon: string
  es: string
  en?: string
}

export type MethodologyBlock =
  | { type: 'h2' | 'h3' | 'p' | 'flow'; es: MethodologyInline[]; en?: MethodologyInline[] }
  | { type: 'ul'; es: string[]; en?: string[] }
  | { type: 'chips'; items: MethodologyChip[] }
  | { type: 'status'; items: MethodologyStatusItem[] }

/** Anchor id for the references block rendered inside the panel. */
export const METHODOLOGY_REFERENCES_ID = 'metodologia-referencias'

export const METHODOLOGY_BLOCKS: MethodologyBlock[] = [
  {
    type: 'h2',
    es: ['¿Qué es Instalando la Democracia?'],
    en: ['What is Installing Democracy?'],
  },
  {
    type: 'p',
    es: ['En Venezuela las cosas pasan a ritmo vertiginoso y con frecuencia los árboles no nos permiten ver el bosque. Cada día ocurre un asunto muy escandaloso, una catástrofe, o simplemente un tema de farándula que monopoliza la discusión pública del momento, y lo urgente va privando sobre lo importante. Umbral ha sido desarrollado por Pablo Hernández como tablero de control para intentar ver el bosque.'],
    en: ['In Venezuela things move at a dizzying pace, and the trees often keep us from seeing the forest. Every day brings some scandal, a catastrophe, or simply a celebrity story that monopolizes the public conversation of the moment, and the urgent keeps crowding out the important. Umbral was built by Pablo Hernández as a control panel to try to see the forest.'],
  },
  {
    type: 'p',
    es: ['En esta capa de Umbral, no estamos intentando predecir la transición; estamos estableciendo qué tendría que ocurrir para poder decir que la transición está avanzando realmente.'],
    en: ["In this layer of Umbral, we are not trying to predict the transition; we are establishing what would have to happen for us to say the transition is genuinely advancing."],
  },

  {
    type: 'h2',
    es: ['¿Cómo medimos una transición democrática?'],
    en: ['How do we measure a democratic transition?'],
  },
  {
    type: 'p',
    es: ['Una transición democrática no ocurre solamente el día de unas elecciones. Una democracia es un ecosistema virtuoso que necesita de instituciones, libertades, seguridad, competencia política y reglas que permitan que el resultado sea aceptado por todos.'],
    en: ['A democratic transition does not happen only on election day. A democracy is a virtuous ecosystem that needs institutions, freedoms, security, political competition, and rules that allow the result to be accepted by everyone.'],
  },
  {
    type: 'p',
    es: ['Por eso construimos una hoja de ruta de 18 meses que convierte las principales propuestas para la transición venezolana en acciones concretas y verificables. Instalando la Democracia no es una predicción, es una lista de necesidades pendientes para conquistar la democracia.'],
    en: ["That's why we built an 18-month roadmap that turns the leading proposals for a Venezuelan transition into concrete, verifiable actions. Installing Democracy is not a prediction — it's a list of outstanding needs on the way to winning democracy."],
  },

  {
    type: 'h3',
    es: ['1. Dividimos la transición en pilares'],
    en: ['1. We divide the transition into pillars'],
  },
  {
    type: 'p',
    es: ['Las acciones están organizadas en grandes áreas que deben avanzar de manera coordinada:'],
    en: ['Actions are organized into broad areas that must advance in a coordinated way:'],
  },
  {
    type: 'chips',
    items: [
      // Covers both `freedoms` and `humanRights` on the tracker; the Feather
      // glyph is used because the label leads with "Libertades".
      { icon: 'freedoms', es: 'Libertades y derechos humanos', en: 'Freedoms and human rights' },
      { icon: 'security', es: 'Seguridad', en: 'Security' },
      { icon: 'institutions', es: 'Instituciones', en: 'Institutions' },
      { icon: 'governance', es: 'Gobernabilidad', en: 'Governance' },
      { icon: 'civilSociety', es: 'Sociedad civil', en: 'Civil society' },
      { icon: 'information', es: 'Información y libertad de prensa', en: 'Information and press freedom' },
      { icon: 'politicalCompetition', es: 'Competencia política', en: 'Political competition' },
      { icon: 'elections', es: 'Elecciones', en: 'Elections' },
      { icon: 'justice', es: 'Justicia', en: 'Justice' },
      { icon: 'economy', es: 'Economía', en: 'Economy' },
      { icon: 'internationalRelations', es: 'Relaciones internacionales', en: 'International relations' },
    ],
  },
  {
    type: 'p',
    es: ['Los pilares permiten ver que una transición puede avanzar en un área y retroceder en otra.'],
    en: ['The pillars make it possible to see that a transition can advance in one area while regressing in another.'],
  },

  {
    type: 'h3',
    es: ['2. Convertimos las propuestas en acciones'],
    en: ['2. We turn proposals into actions'],
  },
  {
    type: 'p',
    es: [
      'A partir de ',
      {
        text: 'una serie de sólidos documentos sobre la transición democrática para Venezuela',
        anchor: METHODOLOGY_REFERENCES_ID,
      },
      ' llegamos a nuestra lista y preguntamos ¿Qué tiene que hacerse?',
    ],
    en: [
      'Starting from ',
      {
        text: 'a set of solid documents on a democratic transition for Venezuela',
        anchor: METHODOLOGY_REFERENCES_ID,
      },
      ', we arrived at our list by asking: what has to be done?',
    ],
  },
  { type: 'p', es: ['Por ejemplo:'], en: ['For example:'] },
  {
    type: 'ul',
    es: [
      'liberar presos políticos;',
      'abrir el Registro Electoral;',
      'renovar la autoridad electoral;',
      'restituir la competencia de los partidos;',
      'garantizar libertad de prensa;',
      'permitir la participación de los venezolanos en el exterior;',
      'realizar elecciones presidenciales y parlamentarias competitivas;',
      'transferir el poder a las autoridades electas.',
    ],
    en: [
      'release political prisoners;',
      'open the Electoral Registry;',
      'renew the electoral authority;',
      'restore competition among parties;',
      'guarantee freedom of the press;',
      'allow Venezuelans abroad to participate;',
      'hold competitive presidential and parliamentary elections;',
      'transfer power to the elected authorities.',
    ],
  },
  {
    type: 'p',
    es: ['Por eso hemos hecho el cronograma a 18 meses. La primera elección presidencial y parlamentaria se entiende así como el comienzo de la reinstitucionalización democrática, no como el final del proceso.'],
    en: ["That's why we built the roadmap on an 18-month horizon. The first presidential and parliamentary election is understood as the beginning of democratic re-institutionalization, not the end of the process."],
  },

  {
    type: 'h3',
    es: ['3. Cada acción debe poder comprobarse'],
    en: ['3. Every action must be verifiable'],
  },
  {
    type: 'p',
    es: ['Para evitar que la transición se convierta en una sucesión de anuncios y promesas, cada acción tiene un indicador verificable. Esta matriz incorpora para cada acción:'],
    en: ['To keep the transition from becoming a string of announcements and promises, every action carries a verifiable indicator. This matrix records, for each action:'],
  },
  {
    type: 'flow',
    es: ['Pilar → Mes → Acción → Indicador → Responsable'],
    en: ['Pillar → Month → Action → Indicator → Responsible party'],
  },
  {
    type: 'p',
    es: ['La estructura sigue un principio fundamental: ningún compromiso debería quedar sin plazo, indicador y fuente de verificación.'],
    en: ['The structure follows one fundamental principle: no commitment should go without a deadline, an indicator, and a source of verification.'],
  },

  {
    type: 'h3',
    es: ['4. Medimos avances, no intenciones'],
    en: ['4. We measure progress, not intentions'],
  },
  {
    type: 'p',
    es: ['Instalando la Democracia permite seguir el proceso como un tablero de control ciudadano.'],
    en: ['Installing Democracy lets the process be tracked as a citizen control panel.'],
  },
  {
    type: 'p',
    es: ['Una transición democrática no siempre puede medirse directamente. Algunas acciones son perfectamente observables (por ejemplo, la designación de un nuevo CNE), mientras que otras requieren valorar hasta qué punto una condición está realmente funcionando: ¿existe libertad de prensa efectiva?, ¿los partidos pueden competir en igualdad?, ¿existe independencia judicial?'],
    en: ['A democratic transition cannot always be measured directly. Some actions are perfectly observable (the appointment of a new CNE, for instance), while others require judging to what extent a condition is actually functioning: Is there effective press freedom? Can parties compete on equal terms? Is the judiciary independent?'],
  },
  {
    type: 'p',
    es: ['Por eso combinamos evidencia disponible y valoración experta. Cada acción del checklist recibe una estimación de su grado de cumplimiento entre 0 y 100%, realizada por un grupo de académicos y especialistas en Ciencia Política, Comunicación y Ciencias Sociales.'],
    en: ["That's why we combine available evidence with expert judgment. Each action on the checklist receives an estimate of its degree of completion between 0 and 100%, produced by a group of academics and specialists in Political Science, Communications, and Social Sciences."],
  },
  {
    type: 'p',
    es: ['Las valoraciones se realizan de manera independiente y posteriormente se agregan para obtener una estimación común.'],
    en: ['Assessments are made independently and then aggregated to produce a shared estimate.'],
  },

  {
    type: 'h3',
    es: ['El tablero utiliza cuatro estados:'],
    en: ['The dashboard uses four states:'],
  },
  {
    type: 'status',
    items: [
      {
        tone: 'completed',
        labelEs: 'Cumplida',
        labelEn: 'Completed',
        rangeEs: '90–100%',
        rangeEn: '90–100%',
        bodyEs: 'Existe evidencia suficiente y los expertos consideran que la condición se encuentra sustancialmente cumplida.',
        bodyEn: 'There is sufficient evidence, and experts consider the condition to be substantially met.',
      },
      {
        tone: 'inProgress',
        labelEs: 'En progreso',
        labelEn: 'In progress',
        rangeEs: '11–89%',
        rangeEn: '11–89%',
        bodyEs: 'Existen avances, pero la condición todavía no se encuentra plenamente cumplida.',
        bodyEn: 'There is progress, but the condition is not yet fully met.',
      },
      {
        tone: 'pending',
        labelEs: 'Pendiente o incumplida',
        labelEn: 'Pending or unmet',
        rangeEs: '0–10%',
        rangeEn: '0–10%',
        bodyEs: 'No existe evidencia suficiente de cumplimiento o los expertos consideran que la condición permanece esencialmente pendiente.',
        bodyEn: 'There is insufficient evidence of completion, or experts consider the condition to remain essentially unmet.',
      },
      {
        tone: 'unrated',
        labelEs: 'No evaluable',
        labelEn: 'Not yet assessable',
        rangeEs: '',
        rangeEn: '',
        bodyEs: 'La información disponible no permite realizar una valoración responsable. No significa que la acción no se haya realizado; significa que todavía no podemos determinarlo.',
        bodyEn: 'The information available does not allow for a responsible assessment. This does not mean the action hasn’t happened — it means we cannot yet determine whether it has.',
      },
    ],
  },

  {
    type: 'h3',
    es: ['¿Por qué expertos?'],
    en: ['Why experts?'],
  },
  {
    type: 'p',
    es: ['Porque algunas dimensiones de una transición democrática son difíciles de observar directamente. La libertad efectiva, la independencia institucional o las condiciones reales de competencia política no siempre pueden reducirse a un dato objetivo.'],
    en: ['Because some dimensions of a democratic transition are hard to observe directly. Effective freedom, institutional independence, or the real conditions for political competition cannot always be reduced to a single objective figure.'],
  },
  {
    type: 'p',
    es: ['El modelo se inspira parcialmente en la metodología de V-Dem (Varieties of Democracy), que utiliza valoraciones de expertos para medir aspectos de la democracia que no son directamente observables y presta especial atención al desacuerdo y a la incertidumbre de esas valoraciones.'],
    en: ['The model draws partly on the V-Dem (Varieties of Democracy) methodology, which uses expert assessments to measure aspects of democracy that are not directly observable, and pays particular attention to the disagreement and uncertainty in those assessments.'],
  },
  {
    type: 'p',
    es: ['Instalando la Democracia utiliza el conocimiento experto para interpretar la evidencia allí donde esta no permite una medición directa.'],
    en: ['Installing Democracy uses expert knowledge to interpret the evidence wherever it does not allow for direct measurement.'],
  },
  {
    type: 'p',
    es: ['El objetivo es hacer visible, de la manera más transparente posible qué está avanzando, qué está detenido, qué está pendiente, y dónde existe riesgo de retroceso.'],
    en: ['The goal is to make visible, as transparently as possible, what is advancing, what is stalled, what remains pending, and where there is a risk of reversal.'],
  },

  {
    type: 'h3',
    es: ['5. Las elecciones son un hito, no el destino. Importa el camino, tanto como el destino'],
    en: ['5. Elections are a milestone, not the destination. The path matters as much as the destination'],
  },
  {
    type: 'p',
    es: [
      {
        text: 'Votar no es lo mismo que elegir',
        href: 'https://transparenciave.org/manifiesto-ciudadano-quiero-elegir/',
      },
      '.',
    ],
    en: [
      {
        text: 'Voting is not the same as choosing',
        href: 'https://transparenciave.org/manifiesto-ciudadano-quiero-elegir/',
      },
      '.',
    ],
  },
  {
    type: 'p',
    es: ['Para que una elección sea democrática, los ciudadanos necesitan poder participar sin miedo, los candidatos deben poder competir, los medios deben poder informar, el Registro Electoral debe ser confiable, las instituciones electorales deben ser independientes y los resultados deben poder ser auditados.'],
    en: ['For an election to be democratic, citizens need to be able to take part without fear, candidates must be able to compete, the media must be able to report freely, the Electoral Registry must be trustworthy, electoral institutions must be independent, and the results must be auditable.'],
  },
  {
    type: 'p',
    es: ['Por eso el checklist incorpora también las condiciones que deben existir antes, durante y después de la elección. La propuesta de sociedad civil que sirve de referencia para esta metodología insiste precisamente en la observación desde las primeras fases, un Registro Electoral abierto y auditado, justicia electoral independiente y resultados completos y verificables.'],
    en: ["That's why the checklist also incorporates the conditions that must exist before, during, and after the election. The civil-society proposal that this methodology draws on insists precisely on observation from the earliest stages, an open and audited Electoral Registry, independent electoral justice, and complete, verifiable results."],
  },
  {
    type: 'p',
    es: ['Instalando la Democracia sigue una pregunta muy concreta: ¿Qué tendría que estar ocurriendo para que dentro de 18 meses podamos afirmar que Venezuela no solamente ha celebrado elecciones, sino que está avanzando hacia una democracia funcional? No mide solamente las acciones resultantes de la negociación entre la Asamblea 2015 y el Gobierno Interino, aunque lo considera pivote central que puede instalar las bases de una transición democrática.'],
    en: ['Installing Democracy follows one very concrete question: what would have to be happening for us to say, 18 months from now, that Venezuela has not only held elections but is advancing toward a functional democracy? It does not measure only the actions resulting from the negotiation between the 2015 National Assembly and the Interim Government, though it treats that negotiation as a central pivot capable of laying the foundations of a democratic transition.'],
  },
  {
    type: 'p',
    es: ['Ese es el propósito de Umbral: convertir la transición democrática en algo que pueda observarse, medirse y exigirse.'],
    en: ["That is Umbral's purpose: to turn the democratic transition into something that can be observed, measured, and demanded."],
  },
]
