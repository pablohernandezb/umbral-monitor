'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, ChevronRight, ArrowLeft,
  Check, X,
  Fingerprint, UserPlus, Eye, Send,
  Landmark, RotateCcw, Vote, Undo, HandFist,
  Wifi,
  GraduationCap,
} from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { submitExpertAction, submitPublicAction, lookupSubmissionAction } from './actions'

// ============================================================
// TYPES
// ============================================================

type Screen =
  | 'entry' | 'returning' | 'classify'
  | 'expert-identity' | 'expert-assessment' | 'expert-confirm' | 'expert-success'
  | 'public-q1' | 'public-q2' | 'public-q3' | 'public-q4'
  | 'public-result' | 'public-submit' | 'public-success'

interface PublicSubmission {
  id: string
  email: string
  resolvedScenario: number
  path: boolean[]
  status: 'published'
  submittedAt: string
}

// ============================================================
// SCENARIO DATA
// ============================================================

const SCENARIOS = [
  {
    number: 1,
    key: 'regressedAutocracy',
    name: { en: 'Regressed Autocracy', es: 'Autocracia Regresiva' },
    shortDesc: {
      en: 'No liberalization processes taking place.',
      es: 'No hay procesos de liberalización en curso.',
    },
    longDesc: {
      en: 'The regime has deepened its authoritarian grip. No meaningful political opening exists, civil liberties remain severely restricted, and opposition forces are systematically neutralized.',
      es: 'El régimen ha profundizado su control autoritario. No existe apertura política significativa, las libertades civiles permanecen severamente restringidas y las fuerzas de oposición son sistemáticamente neutralizadas.',
    },
    icon: HandFist,
    color: 'text-signal-red',
    bgColor: 'bg-signal-red/10',
    borderColor: 'border-signal-red/30',
  },
  {
    number: 2,
    key: 'revertedLiberalization',
    name: { en: 'Reverted Liberalization', es: 'Liberalización Revertida' },
    shortDesc: {
      en: 'Liberalization began but failed without free elections or economic stability.',
      es: 'La liberalización comenzó pero fracasó sin elecciones libres ni estabilidad económica.',
    },
    longDesc: {
      en: 'Initial opening moves were reversed. Liberalization processes began, but the absence of free elections combined with economic instability led to a rollback of reforms and a return to tighter control.',
      es: 'Los movimientos iniciales de apertura fueron revertidos. Los procesos de liberalización comenzaron, pero la ausencia de elecciones libres combinada con inestabilidad económica llevó a un retroceso de las reformas.',
    },
    icon: RotateCcw,
    color: 'text-signal-red',
    bgColor: 'bg-signal-red/10',
    borderColor: 'border-signal-red/30',
  },
  {
    number: 3,
    key: 'stabilizedElectoralAutocracy',
    name: { en: 'Stabilized Electoral Autocracy', es: 'Autocracia Electoral Estabilizada' },
    shortDesc: {
      en: 'Liberalization began, no free elections, but economic stabilization succeeded.',
      es: 'La liberalización comenzó, sin elecciones libres, pero la estabilización económica tuvo éxito.',
    },
    longDesc: {
      en: 'A new authoritarian equilibrium has been reached. The regime maintains control through managed elections while delivering enough economic stability to sustain its legitimacy.',
      es: 'Se ha alcanzado un nuevo equilibrio autoritario. El régimen mantiene el control a través de elecciones administradas mientras ofrece suficiente estabilidad económica para sostener su legitimidad.',
    },
    icon: Vote,
    color: 'text-signal-amber',
    bgColor: 'bg-signal-amber/10',
    borderColor: 'border-signal-amber/30',
  },
  {
    number: 4,
    key: 'preemptedDemocraticTransition',
    name: { en: 'Preempted Democratic Transition', es: 'Transición Democrática Prevenida' },
    shortDesc: {
      en: 'Free and fair elections exist, but democracy is NOT yet the only game in town.',
      es: 'Existen elecciones libres y justas, pero la democracia AÚN NO es el único juego en la ciudad.',
    },
    longDesc: {
      en: 'Electoral democracy has been achieved but remains fragile. Elections are competitive, but democratic consolidation is incomplete and anti-democratic forces retain the capacity to reverse gains.',
      es: 'Se ha logrado la democracia electoral pero sigue siendo frágil. Las elecciones son competitivas, pero la consolidación democrática es incompleta y fuerzas antidemocráticas retienen capacidad de revertir avances.',
    },
    icon: Undo,
    color: 'text-signal-amber',
    bgColor: 'bg-signal-amber/10',
    borderColor: 'border-signal-amber/30',
  },
  {
    number: 5,
    key: 'democraticTransition',
    name: { en: 'Democratic Transition', es: 'Transición Democrática' },
    shortDesc: {
      en: 'Free and fair elections exist, and democracy IS the only game in town.',
      es: 'Existen elecciones libres y justas, y la democracia ES el único juego en la ciudad.',
    },
    longDesc: {
      en: 'Full democratic transition achieved. Free and fair elections are the accepted mechanism for power transfer, democratic institutions are functional, and all major actors accept democratic rules.',
      es: 'Transición democrática plena lograda. Las elecciones libres y justas son el mecanismo aceptado para la transferencia de poder, las instituciones democráticas funcionan y todos los actores principales aceptan las reglas democráticas.',
    },
    icon: Landmark,
    color: 'text-signal-blue',
    bgColor: 'bg-signal-blue/10',
    borderColor: 'border-signal-blue/30',
  },
]

const LIKERT_LABELS = [
  { value: 1, en: 'VERY UNLIKELY', es: 'MUY IMPROBABLE' },
  { value: 2, en: 'UNLIKELY', es: 'IMPROBABLE' },
  { value: 3, en: 'POSSIBLE', es: 'POSIBLE' },
  { value: 4, en: 'LIKELY', es: 'PROBABLE' },
  { value: 5, en: 'VERY LIKELY', es: 'MUY PROBABLE' },
]

const QUESTIONS: Array<{ screen: Screen; text: { en: string; es: string } }> = [
  { screen: 'public-q1', text: { en: 'Are liberalization processes taking place?', es: '¿Están ocurriendo procesos de liberalización?' } },
  { screen: 'public-q2', text: { en: 'Are there free and fair elections?', es: '¿Existen elecciones libres y justas?' } },
  { screen: 'public-q3', text: { en: 'Is democracy the only game in town?', es: '¿Es la democracia el único juego en la ciudad?' } },
  { screen: 'public-q4', text: { en: 'Has economic stabilization been successful?', es: '¿Ha sido exitosa la estabilización económica?' } },
]

// ============================================================
// UTILITIES
// ============================================================

function generateId(prefix: string): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0')
  return `${prefix}-${date}-${seq}`
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

function ScanLines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.015]"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20, 184, 166, 0.8) 2px, rgba(20, 184, 166, 0.8) 4px)',
      }}
    />
  )
}

function BlinkCursor() {
  return <span className="inline-block w-2.5 h-5 bg-signal-teal animate-pulse ml-1 align-middle" />
}

function TacticalButton({
  children, onClick, variant = 'default', active = false, disabled = false, className, size = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger' | 'success' | 'primary'
  active?: boolean
  disabled?: boolean
  className?: string
  size?: 'default' | 'large' | 'small'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative font-mono uppercase tracking-wider transition-all duration-200 border',
        size === 'large' && 'px-8 py-5 text-base',
        size === 'default' && 'px-6 py-3 text-sm',
        size === 'small' && 'px-3 py-1.5 text-xs',
        variant === 'default' && !active && 'border-umbral-steel text-umbral-light hover:border-signal-teal hover:text-signal-teal bg-umbral-black/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]',
        variant === 'default' && active && 'border-signal-teal text-signal-teal bg-signal-teal/10 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
        variant === 'primary' && 'border-signal-teal text-umbral-black bg-signal-teal hover:bg-signal-teal/90 hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] font-bold',
        variant === 'danger' && !active && 'border-signal-red/50 text-signal-red hover:border-signal-red hover:bg-signal-red/10 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]',
        variant === 'danger' && active && 'border-signal-red text-signal-red bg-signal-red/10 shadow-[0_0_15px_rgba(220,38,38,0.2)]',
        variant === 'success' && 'border-signal-teal/50 text-signal-teal hover:border-signal-teal hover:bg-signal-teal/10',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  )
}

function TacticalInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono uppercase tracking-wider text-umbral-muted">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-umbral-black/80 border border-umbral-ash text-white font-mono text-sm placeholder-umbral-steel focus:outline-none focus:border-signal-teal focus:shadow-[0_0_10px_rgba(20,184,166,0.15)] transition-all"
      />
    </div>
  )
}

function ScreenShell({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center px-4 py-24', className)}>
      <div className={cn('w-full', wide ? 'max-w-4xl' : 'max-w-2xl')}>{children}</div>
    </div>
  )
}

function BackButton({ onClick, locale }: { onClick: () => void; locale: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-xs font-mono text-umbral-muted hover:text-signal-teal transition-colors mb-8 uppercase tracking-wider"
    >
      <ArrowLeft className="w-3 h-3" />
      {locale === 'es' ? 'Volver' : 'Back'}
    </button>
  )
}

function StepIndicator({ current, total, locale }: { current: number; total: number; locale: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="text-xs font-mono text-umbral-muted uppercase tracking-wider">
        {locale === 'es' ? 'CONSULTA' : 'QUERY'} {current} / {total}
      </span>
      <div className="flex-1 h-px bg-umbral-ash">
        <div
          className="h-full bg-signal-teal transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function ParticipatePage() {
  const { locale } = useTranslation()

  // Screen navigation
  const [screen, setScreen] = useState<Screen>('entry')
  const [screenHistory, setScreenHistory] = useState<Screen[]>([])

  // Expert form state
  const [expertName, setExpertName] = useState('')
  const [expertEmail, setExpertEmail] = useState('')
  const [expertInstitution, setExpertInstitution] = useState('')
  const [expertIdeology, setExpertIdeology] = useState(5)
  const [expertRatings, setExpertRatings] = useState<Record<number, number>>({})

  // Public flow state
  const [publicAnswers, setPublicAnswers] = useState<boolean[]>([])
  const [resolvedScenario, setResolvedScenario] = useState<number | null>(null)
  const [publicEmail, setPublicEmail] = useState('')
  const [questionStep, setQuestionStep] = useState(1)

  // Returning participant
  const [returningEmail, setReturningEmail] = useState('')
  const [retrievedRecord, setRetrievedRecord] = useState<PublicSubmission | null>(null)

  // Submission result
  const [lastSubmissionId, setLastSubmissionId] = useState('')

  // Typewriter state for scenario reveal
  const [revealedChars, setRevealedChars] = useState(0)
  const [showFullResult, setShowFullResult] = useState(false)

  // ---- Navigation helpers ----

  const navigateTo = useCallback((next: Screen) => {
    setScreenHistory(prev => [...prev, screen])
    setScreen(next)
  }, [screen])

  const goBack = useCallback(() => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1]
      setScreenHistory(h => h.slice(0, -1))
      setScreen(prev)
    } else {
      setScreen('entry')
    }
  }, [screenHistory])

  // ---- Typewriter effect for scenario reveal ----

  useEffect(() => {
    if (screen !== 'public-result' || resolvedScenario === null) return
    setRevealedChars(0)
    setShowFullResult(false)
    const scenario = SCENARIOS[resolvedScenario - 1]
    const fullText = scenario.name[locale as 'en' | 'es']
    let i = 0
    const interval = setInterval(() => {
      i++
      setRevealedChars(i)
      if (i >= fullText.length) {
        clearInterval(interval)
        setTimeout(() => setShowFullResult(true), 400)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [screen, resolvedScenario, locale])

  // ---- Decision tree handler ----

  const handlePublicAnswer = useCallback((currentScreen: Screen, answer: boolean) => {
    setPublicAnswers(prev => [...prev, answer])

    switch (currentScreen) {
      case 'public-q1':
        if (!answer) {
          setResolvedScenario(1)
          setQuestionStep(s => s + 1)
          navigateTo('public-result')
        } else {
          setQuestionStep(s => s + 1)
          navigateTo('public-q2')
        }
        break
      case 'public-q2':
        setQuestionStep(s => s + 1)
        navigateTo(answer ? 'public-q3' : 'public-q4')
        break
      case 'public-q3':
        setResolvedScenario(answer ? 5 : 4)
        navigateTo('public-result')
        break
      case 'public-q4':
        setResolvedScenario(answer ? 3 : 2)
        navigateTo('public-result')
        break
    }
  }, [navigateTo])

  // ---- Expert submit ----

  const handleExpertSubmit = useCallback(async () => {
    const { data, error } = await submitExpertAction({
      name: expertName,
      email: expertEmail,
      institution: expertInstitution,
      ideology_score: expertIdeology,
      scenario_probabilities: { ...expertRatings },
    })
    if (error) {
      console.error('Failed to submit expert assessment:', error)
    }
    setLastSubmissionId(data?.id || generateId('EXP'))
    navigateTo('expert-success')
  }, [expertName, expertEmail, expertInstitution, expertIdeology, expertRatings, navigateTo])

  // ---- Public submit ----

  const handlePublicSubmit = useCallback(async () => {
    if (resolvedScenario === null) return
    const { data, error } = await submitPublicAction({
      email: publicEmail,
      resolved_scenario: resolvedScenario,
      path: publicAnswers,
    })
    if (error) {
      console.error('Failed to submit public response:', error)
    }
    setLastSubmissionId(data?.id || generateId('PUB'))
    navigateTo('public-success')
  }, [publicEmail, resolvedScenario, publicAnswers, navigateTo])

  // ---- Returning participant retrieve ----

  const handleRetrieve = useCallback(async () => {
    const { data } = await lookupSubmissionAction(returningEmail)
    if (data) {
      // Map DB fields to the local type format
      setRetrievedRecord({
        id: data.id,
        email: data.email,
        resolvedScenario: data.resolved_scenario,
        path: data.path,
        status: 'published',
        submittedAt: data.submitted_at,
      })
    } else {
      setRetrievedRecord(null)
    }
  }, [returningEmail])

  // ---- Reset for new participation ----

  const resetAll = useCallback(() => {
    setExpertName(''); setExpertEmail(''); setExpertInstitution('')
    setExpertIdeology(5); setExpertRatings({})
    setPublicAnswers([]); setResolvedScenario(null); setPublicEmail('')
    setQuestionStep(1); setReturningEmail(''); setRetrievedRecord(null)
    setLastSubmissionId(''); setScreenHistory([])
    setScreen('entry')
  }, [])

  // ---- Validation helpers ----

  const expertIdentityValid = expertName.trim() && expertEmail.trim() && expertInstitution.trim()
  const expertAssessmentValid = Object.keys(expertRatings).length === 5

  // ============================================================
  // RENDER SCREENS
  // ============================================================

  function renderScreen() {
    switch (screen) {
      // ---- SCREEN 0: ENTRY GATE ----
      case 'entry':
        return (
          <ScreenShell>
            <div className="text-center space-y-10">
              <div>
                <Wifi size={150} className="text-signal-teal/60 animate-pulse mx-auto mb-6" />
                <p className="text-base font-mono text-signal-teal/60 uppercase tracking-[0.3em] mb-4">
                  {locale === 'es' ? '// SISTEMA UMBRAL' : '// UMBRAL SYSTEM'}
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-white leading-tight">
                  {locale === 'es'
                    ? '// PROTOCOLO DE PARTICIPACIÓN INICIADO'
                    : '// PARTICIPATION PROTOCOL INITIATED'}
                  <BlinkCursor />
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <TacticalButton size="large" onClick={() => navigateTo('returning')}>
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5" />
                    {locale === 'es' ? 'PARTICIPANTE RECURRENTE' : 'RETURNING PARTICIPANT'}
                  </div>
                </TacticalButton>
                <TacticalButton size="large" variant="primary" onClick={() => navigateTo('classify')}>
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5" />
                    {locale === 'es' ? 'NUEVO PARTICIPANTE' : 'NEW PARTICIPANT'}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </TacticalButton>
              </div>

              <p className="text-xs font-mono text-umbral-steel">
                {locale === 'es'
                  ? '// Tu evaluación contribuye al monitoreo público de escenarios'
                  : '// Your assessment contributes to public scenario monitoring'}
              </p>
            </div>
          </ScreenShell>
        )

      // ---- SCREEN 0-R: RETURNING PARTICIPANT ----
      case 'returning':
        return (
          <ScreenShell>
            <BackButton onClick={goBack} locale={locale} />
            <h2 className="text-xl font-bold font-mono text-white mb-8">
              {locale === 'es' ? '// RECUPERAR REGISTRO' : '// RETRIEVE RECORD'}
              <BlinkCursor />
            </h2>

            <div className="space-y-4">
              <TacticalInput
                label={locale === 'es' ? 'ID DE PARTICIPANTE / EMAIL' : 'PARTICIPANT ID / EMAIL'}
                value={returningEmail}
                onChange={setReturningEmail}
                placeholder="email@example.com"
              />
              <TacticalButton onClick={handleRetrieve} disabled={!returningEmail.trim()}>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {locale === 'es' ? 'RECUPERAR REGISTRO' : 'RETRIEVE RECORD'}
                </div>
              </TacticalButton>
            </div>

            {retrievedRecord && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 border border-signal-teal/30 bg-signal-teal/5 p-6 space-y-4"
              >
                <p className="text-xs font-mono text-signal-teal uppercase tracking-wider">
                  // {locale === 'es' ? 'REGISTRO ENCONTRADO' : 'RECORD FOUND'}
                </p>
                <div className="space-y-2 text-sm font-mono">
                  <p className="text-umbral-muted">ID: <span className="text-white">{retrievedRecord.id}</span></p>
                  <p className="text-umbral-muted">
                    {locale === 'es' ? 'Escenario' : 'Scenario'}: <span className="text-white font-bold">
                      S{retrievedRecord.resolvedScenario} — {SCENARIOS[retrievedRecord.resolvedScenario - 1].name[locale as 'en' | 'es']}
                    </span>
                  </p>
                  <p className="text-umbral-muted">
                    {locale === 'es' ? 'Enviado' : 'Submitted'}: <span className="text-white">{new Date(retrievedRecord.submittedAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <p className="text-[10px] font-mono text-umbral-steel">
                  // BACKEND: {locale === 'es' ? 'Punto de integración para actualizar y reenviar' : 'Integration point for update and resubmit'}
                </p>
                <TacticalButton size="small" onClick={() => {
                  setPublicAnswers([])
                  setResolvedScenario(null)
                  setQuestionStep(1)
                  navigateTo('public-q1')
                }}>
                  {locale === 'es' ? 'ACTUALIZAR Y REENVIAR' : 'UPDATE & RESUBMIT'}
                </TacticalButton>
              </motion.div>
            )}

            {returningEmail.trim() && retrievedRecord === null && (
              <p className="mt-6 text-sm font-mono text-signal-red/70">
                // {locale === 'es' ? 'NO SE ENCONTRÓ REGISTRO' : 'NO RECORD FOUND'}
              </p>
            )}
          </ScreenShell>
        )

      // ---- SCREEN 1: CLASSIFY ----
      case 'classify':
        return (
          <ScreenShell>
            <BackButton onClick={goBack} locale={locale} />
            <h2 className="text-xl font-bold font-mono text-white mb-2">
              {locale === 'es' ? '// CLASIFICAR OPERADOR' : '// CLASSIFY OPERATOR'}
              <BlinkCursor />
            </h2>
            <p className="text-sm font-mono text-umbral-muted mb-10">
              {locale === 'es'
                ? '// Seleccione su perfil de participación'
                : '// Select your participation profile'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => navigateTo('expert-identity')}
                className="group border border-umbral-ash bg-umbral-black/50 p-6 text-left hover:border-signal-teal hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] transition-all space-y-4"
              >
                <div className="w-12 h-12 border border-signal-teal/30 bg-signal-teal/5 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-signal-teal" />
                </div>
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider group-hover:text-signal-teal transition-colors">
                    {locale === 'es' ? 'ANALISTA EXPERTO' : 'EXPERT ANALYST'}
                  </h3>
                  <p className="text-xs font-mono text-umbral-muted mt-1">
                    {locale === 'es'
                      ? 'Académico, investigador, analista'
                      : 'Academic, researcher, scholar'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-umbral-steel group-hover:text-signal-teal transition-colors" />
              </button>

              <button
                onClick={() => {
                  setPublicAnswers([])
                  setResolvedScenario(null)
                  setQuestionStep(1)
                  navigateTo('public-q1')
                }}
                className="group border border-umbral-ash bg-umbral-black/50 p-6 text-left hover:border-signal-amber hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all space-y-4"
              >
                <div className="w-12 h-12 border border-signal-amber/30 bg-signal-amber/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-signal-amber" />
                </div>
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider group-hover:text-signal-amber transition-colors">
                    {locale === 'es' ? 'PÚBLICO GENERAL' : 'GENERAL PUBLIC'}
                  </h3>
                  <p className="text-xs font-mono text-umbral-muted mt-1">
                    {locale === 'es' ? 'Ciudadano observador' : 'Citizen observer'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-umbral-steel group-hover:text-signal-amber transition-colors" />
              </button>
            </div>
          </ScreenShell>
        )

      // ---- EXPERT E1: IDENTITY ----
      case 'expert-identity':
        return (
          <ScreenShell>
            <BackButton onClick={goBack} locale={locale} />
            <h2 className="text-xl font-bold font-mono text-white mb-8">
              {locale === 'es' ? '// IDENTIFICACIÓN DEL ANALISTA' : '// ANALYST IDENTIFICATION'}
              <BlinkCursor />
            </h2>

            <div className="space-y-5">
              <TacticalInput label={locale === 'es' ? 'NOMBRE COMPLETO' : 'FULL NAME'} value={expertName} onChange={setExpertName} />
              <TacticalInput
                label={locale === 'es' ? 'EMAIL INSTITUCIONAL / LABORAL PREFERIDO' : 'INSTITUTIONAL / WORK EMAIL PREFERRED'}
                value={expertEmail} onChange={setExpertEmail} type="email"
              />
              <TacticalInput label={locale === 'es' ? 'INSTITUCIÓN / AFILIACIÓN' : 'INSTITUTION / AFFILIATION'} value={expertInstitution} onChange={setExpertInstitution} />

              {/* Ideology slider */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-umbral-muted">
                  {locale === 'es' ? 'AUTO-UBICACIÓN IDEOLÓGICA' : 'IDEOLOGICAL SELF-PLACEMENT'}
                </label>
                <div className="flex items-center justify-between text-xs font-mono text-umbral-steel px-1">
                  <span>◀ {locale === 'es' ? 'IZQUIERDA' : 'LEFT'}</span>
                  <span>{locale === 'es' ? 'DERECHA' : 'RIGHT'} ▶</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setExpertIdeology(i)}
                      className={cn(
                        'flex-1 h-10 border text-xs font-mono transition-all',
                        i === expertIdeology
                          ? 'border-signal-teal bg-signal-teal/20 text-signal-teal shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                          : 'border-umbral-ash bg-umbral-black/50 text-umbral-muted hover:border-umbral-steel',
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1 bg-signal-teal/10 border border-signal-teal/30 text-signal-teal font-mono text-lg font-bold">
                    {expertIdeology}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <TacticalButton onClick={() => navigateTo('expert-assessment')} disabled={!expertIdentityValid}>
                <div className="flex items-center gap-2">
                  {locale === 'es' ? 'CONTINUAR' : 'CONTINUE'}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </TacticalButton>
            </div>
          </ScreenShell>
        )

      // ---- EXPERT E2: SCENARIO ASSESSMENT ----
      case 'expert-assessment':
        return (
          <ScreenShell className="py-24" wide>
            <BackButton onClick={goBack} locale={locale} />
            <h2 className="text-xl font-bold font-mono text-white mb-2">
              {locale === 'es'
                ? '// ASIGNAR PESO DE PROBABILIDAD A CADA TRAYECTORIA'
                : '// ASSIGN PROBABILITY WEIGHT TO EACH TRAJECTORY'}
            </h2>
            <p className="text-xs font-mono text-umbral-muted mb-8">
              {locale === 'es'
                ? '// Seleccione una valoración por escenario'
                : '// Select one rating per scenario'}
            </p>

            <div className="space-y-6">
              {SCENARIOS.map((scenario) => {
                const Icon = scenario.icon
                const selected = expertRatings[scenario.number]
                return (
                  <div key={scenario.number} className={cn('border p-4 space-y-3', selected ? scenario.borderColor : 'border-umbral-ash')}>
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-5 h-5', scenario.color)} />
                      <span className={cn('font-mono font-bold text-sm uppercase', scenario.color)}>
                        S{scenario.number} — {scenario.name[locale as 'en' | 'es']}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-umbral-muted">{scenario.shortDesc[locale as 'en' | 'es']}</p>
                    <div className="flex gap-1 flex-wrap">
                      {LIKERT_LABELS.map((likert) => (
                        <button
                          key={likert.value}
                          onClick={() => setExpertRatings(prev => ({ ...prev, [scenario.number]: likert.value }))}
                          className={cn(
                            'flex-1 min-w-[80px] px-2 py-2 text-[10px] font-mono uppercase tracking-wider border transition-all',
                            selected === likert.value
                              ? `${scenario.bgColor} ${scenario.color} ${scenario.borderColor} shadow-[0_0_10px_rgba(20,184,166,0.1)]`
                              : 'border-umbral-ash text-umbral-muted bg-umbral-black/50 hover:border-umbral-steel',
                          )}
                        >
                          {likert.value} — {likert[locale as 'en' | 'es']}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <TacticalButton onClick={() => navigateTo('expert-confirm')} disabled={!expertAssessmentValid}>
                <div className="flex items-center gap-2">
                  {locale === 'es' ? 'REVISAR' : 'REVIEW'}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </TacticalButton>
            </div>
          </ScreenShell>
        )

      // ---- EXPERT E3: CONFIRMATION ----
      case 'expert-confirm':
        return (
          <ScreenShell>
            <BackButton onClick={goBack} locale={locale} />
            <h2 className="text-xl font-bold font-mono text-white mb-8">
              {locale === 'es' ? '// CONFIRMAR EVALUACIÓN' : '// CONFIRM ASSESSMENT'}
            </h2>

            <div className="border border-umbral-ash p-6 space-y-4 bg-umbral-black/50">
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <p className="text-umbral-muted text-xs">{locale === 'es' ? 'NOMBRE' : 'NAME'}</p>
                  <p className="text-white">{expertName}</p>
                </div>
                <div>
                  <p className="text-umbral-muted text-xs">EMAIL</p>
                  <p className="text-white">{expertEmail}</p>
                </div>
                <div>
                  <p className="text-umbral-muted text-xs">{locale === 'es' ? 'INSTITUCIÓN' : 'INSTITUTION'}</p>
                  <p className="text-white">{expertInstitution}</p>
                </div>
                <div>
                  <p className="text-umbral-muted text-xs">{locale === 'es' ? 'IDEOLOGÍA' : 'IDEOLOGY'}</p>
                  <p className="text-signal-teal font-bold">{expertIdeology} / 10</p>
                </div>
              </div>

              <div className="border-t border-umbral-ash pt-4">
                <p className="text-xs font-mono text-umbral-muted uppercase tracking-wider mb-3">
                  {locale === 'es' ? 'VALORACIONES DE ESCENARIOS' : 'SCENARIO RATINGS'}
                </p>
                {SCENARIOS.map((s) => {
                  const rating = expertRatings[s.number]
                  const label = LIKERT_LABELS.find(l => l.value === rating)
                  return (
                    <div key={s.number} className="flex items-center justify-between py-1.5 text-sm font-mono">
                      <span className={cn(s.color)}>S{s.number} — {s.name[locale as 'en' | 'es']}</span>
                      <span className="text-white">{label?.[locale as 'en' | 'es']}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="mt-6 text-xs font-mono text-signal-amber/70 border border-signal-amber/20 bg-signal-amber/5 px-4 py-3">
              // {locale === 'es'
                ? 'SU EVALUACIÓN SERÁ REVISADA ANTES DE PUBLICACIÓN'
                : 'YOUR ASSESSMENT WILL BE REVIEWED BEFORE PUBLICATION'}
            </p>

            <div className="mt-6 flex justify-end">
              <TacticalButton variant="primary" onClick={handleExpertSubmit}>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {locale === 'es' ? 'ENVIAR EVALUACIÓN' : 'SUBMIT ASSESSMENT'}
                </div>
              </TacticalButton>
            </div>
          </ScreenShell>
        )

      // ---- EXPERT SUCCESS ----
      case 'expert-success':
        return (
          <ScreenShell>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto border border-signal-teal bg-signal-teal/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-signal-teal" />
              </div>
              <h2 className="text-xl font-bold font-mono text-white">
                {locale === 'es' ? '// EVALUACIÓN RECIBIDA' : '// ASSESSMENT RECEIVED'}
              </h2>
              <div className="inline-flex items-center px-4 py-2 border border-signal-teal/30 bg-signal-teal/5 font-mono text-signal-teal text-sm">
                ID: {lastSubmissionId}
              </div>
              <p className="text-sm font-mono text-umbral-muted">
                {locale === 'es'
                  ? '// PENDIENTE DE AUTORIZACIÓN ADMINISTRATIVA'
                  : '// PENDING ADMIN AUTHORIZATION'}
              </p>
              <TacticalButton onClick={resetAll}>
                {locale === 'es' ? 'VOLVER AL INICIO' : 'RETURN TO START'}
              </TacticalButton>
            </div>
          </ScreenShell>
        )

      // ---- PUBLIC Q1–Q4: DECISION TREE ----
      case 'public-q1':
      case 'public-q2':
      case 'public-q3':
      case 'public-q4': {
        const qIndex = ['public-q1', 'public-q2', 'public-q3', 'public-q4'].indexOf(screen)
        const question = QUESTIONS[qIndex]
        return (
          <ScreenShell>
            <BackButton onClick={goBack} locale={locale} />
            <StepIndicator current={questionStep} total={3} locale={locale} />

            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white leading-tight mb-12">
              // {question.text[locale as 'en' | 'es']}
              <BlinkCursor />
            </h2>

            <div className="flex gap-4">
              <TacticalButton
                size="large"
                className="flex-1"
                variant="success"
                onClick={() => handlePublicAnswer(screen, true)}
              >
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  {locale === 'es' ? 'SÍ' : 'YES'}
                </div>
              </TacticalButton>
              <TacticalButton
                size="large"
                className="flex-1"
                variant="danger"
                onClick={() => handlePublicAnswer(screen, false)}
              >
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5" />
                  NO
                </div>
              </TacticalButton>
            </div>
          </ScreenShell>
        )
      }

      // ---- PUBLIC RESULT: SCENARIO REVEAL ----
      case 'public-result': {
        if (resolvedScenario === null) return null
        const scenario = SCENARIOS[resolvedScenario - 1]
        const Icon = scenario.icon
        const fullName = scenario.name[locale as 'en' | 'es']
        const displayedName = fullName.slice(0, revealedChars)

        return (
          <ScreenShell>
            <div className="text-center space-y-8">
              <p className="text-xs font-mono text-umbral-muted uppercase tracking-[0.3em]">
                // {locale === 'es' ? 'ESCENARIO RESUELTO' : 'RESOLVED SCENARIO'}
              </p>

              <div className="space-y-4">
                <div className={cn('w-20 h-20 mx-auto border flex items-center justify-center', scenario.borderColor, scenario.bgColor)}>
                  <Icon className={cn('w-10 h-10', scenario.color)} />
                </div>
                <p className={cn('text-4xl font-bold font-mono', scenario.color)}>S{scenario.number}</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white min-h-[2.5rem]">
                  {displayedName}
                  {revealedChars < fullName.length && <BlinkCursor />}
                </h2>
              </div>

              <AnimatePresence>
                {showFullResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <p className="text-sm font-mono text-umbral-muted max-w-lg mx-auto leading-relaxed">
                      {scenario.longDesc[locale as 'en' | 'es']}
                    </p>

                    <div className="border-t border-umbral-ash pt-6">
                      <p className="text-sm font-mono text-umbral-light mb-6">
                        // {locale === 'es'
                          ? '¿DESEA ENVIAR SU RESPUESTA AL MONITOR PÚBLICO?'
                          : 'DO YOU WISH TO SUBMIT YOUR RESPONSE TO THE PUBLIC MONITOR?'}
                      </p>
                      <div className="flex gap-4 justify-center">
                        <TacticalButton variant="primary" onClick={() => navigateTo('public-submit')}>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            {locale === 'es' ? 'SÍ, ENVIAR' : 'YES, SUBMIT'}
                          </div>
                        </TacticalButton>
                        <TacticalButton onClick={resetAll}>
                          {locale === 'es' ? 'NO, SALIR' : 'NO, EXIT'}
                        </TacticalButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScreenShell>
        )
      }

      // ---- PUBLIC SUBMIT ----
      case 'public-submit':
        return (
          <ScreenShell>
            <BackButton onClick={goBack} locale={locale} />
            <h2 className="text-xl font-bold font-mono text-white mb-8">
              {locale === 'es'
                ? '// PROPORCIONE EMAIL PARA REGISTRAR SU RESPUESTA'
                : '// PROVIDE EMAIL TO LOG YOUR RESPONSE'}
              <BlinkCursor />
            </h2>

            <div className="space-y-4">
              <TacticalInput
                label="EMAIL"
                value={publicEmail}
                onChange={setPublicEmail}
                type="email"
                placeholder="email@example.com"
              />
              <TacticalButton variant="primary" onClick={handlePublicSubmit} disabled={!publicEmail.trim()}>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {locale === 'es' ? 'CONFIRMAR Y TRANSMITIR' : 'CONFIRM & TRANSMIT'}
                </div>
              </TacticalButton>
            </div>
          </ScreenShell>
        )

      // ---- PUBLIC SUCCESS ----
      case 'public-success':
        return (
          <ScreenShell>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto border border-signal-teal bg-signal-teal/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-signal-teal" />
              </div>
              <h2 className="text-xl font-bold font-mono text-white">
                {locale === 'es' ? '// RESPUESTA REGISTRADA' : '// RESPONSE LOGGED'}
              </h2>
              <div className="inline-flex items-center px-4 py-2 border border-signal-teal/30 bg-signal-teal/5 font-mono text-signal-teal text-sm">
                ID: {lastSubmissionId}
              </div>
              <p className="text-sm font-mono text-umbral-muted">
                // {locale === 'es'
                  ? 'ACTUALIZANDO MONITOR PÚBLICO'
                  : 'UPDATING PUBLIC MONITOR'}
              </p>
              <TacticalButton onClick={resetAll}>
                {locale === 'es' ? 'VOLVER AL INICIO' : 'RETURN TO START'}
              </TacticalButton>
            </div>
          </ScreenShell>
        )

      default:
        return null
    }
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="relative min-h-screen bg-umbral-black">
      <ScanLines />

      {/* Subtle background grid */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
