'use client'

import { motion } from 'framer-motion'
import { 
  Database, 
  BookOpen, 
  Users, 
  FileText, 
  ExternalLink,
  CheckCircle,
  Globe,
  TrendingUpDown,
  BarChart3,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/i18n'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

// Data sources
const academicSources = [
  {
    name: 'V-Dem (Varieties of Democracy)',
    url: 'https://www.v-dem.net/',
    description: 'Índices de democracia y datos históricos sobre regímenes políticos.',
  },
  {
    name: 'ERT Dataset',
    url: 'https://v-dem.net/data/ert-dataset/',
    description: 'Episodes of Regime Transformation - clasificación de episodios de democratización y autocratización.',
  },
  {
    name: 'DEED (Democratic Episodes Event Dataset)',
    url: 'https://democratic-erosion.org/dataset/',
    description: 'Base de datos de eventos durante episodios de cambio democrático.',
  },
]

const mediaSources = [
  { name: 'Efecto Cocuyo', url: 'https://efectococuyo.com' },
  { name: 'El Pitazo', url: 'https://elpitazo.net' },
  { name: 'Runrunes', url: 'https://runrun.es' },
  { name: 'Tal Cual', url: 'https://talcualdigital.com' },
  { name: 'Crónica Uno', url: 'https://cronica.uno' },
]

const humanRightsSources = [
  { name: 'Foro Penal', url: 'https://foropenal.com' },
  { name: 'PROVEA', url: 'https://provea.org' },
  { name: 'CLIPPVE', url: '#' },
  { name: 'Justicia Encuentro y Perdón', url: '#' },
  { name: 'UN Fact-Finding Mission', url: 'https://www.ohchr.org/en/hr-bodies/hrc/ffmv/index' },
]

export default function AboutPage() {
  const { t, locale } = useTranslation()

  return (
    <div className="relative">
      {/* Hero section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-signal-teal/5 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
            >
              {t('about.title')}
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-umbral-muted max-w-2xl mx-auto"
            >
              {locale === 'es'
                ? 'Una plataforma de inteligencia cívica diseñada para la transparencia y la rendición de cuentas.'
                : 'A civic intelligence platform designed for transparency and accountability.'
              }
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* What is Umbral */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="card p-6 md:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-signal-teal/10 border border-signal-teal/30 flex items-center justify-center">
                <TrendingUpDown className="w-6 h-6 text-signal-teal" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('about.whatIs.title')}
              </h2>
            </div>
            <p className="text-umbral-light leading-relaxed text-lg">
              {t('about.whatIs.content')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Scope and Purpose */}
      <section className="section bg-umbral-charcoal/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 rounded-xl bg-signal-amber/10 border border-signal-amber/30 flex items-center justify-center">
                <Globe className="w-6 h-6 text-signal-amber" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('about.scope.title')}
              </h2>
            </motion.div>

            <motion.p 
              variants={fadeInUp}
              className="text-umbral-light leading-relaxed text-lg mb-8"
            >
              {t('about.scope.content')}
            </motion.p>

            {/* Principles */}
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {[
                { 
                  icon: CheckCircle, 
                  title: locale === 'es' ? 'Independencia' : 'Independence',
                  text: locale === 'es' 
                    ? 'Sin afiliación política ni gubernamental'
                    : 'No political or government affiliation'
                },
                { 
                  icon: Database, 
                  title: locale === 'es' ? 'Datos abiertos' : 'Open Data',
                  text: locale === 'es' 
                    ? 'Fuentes verificables y metodología transparente'
                    : 'Verifiable sources and transparent methodology'
                },
                { 
                  icon: BarChart3, 
                  title: locale === 'es' ? 'Sin predicciones' : 'No Predictions',
                  text: locale === 'es' 
                    ? 'Análisis de patrones, no pronósticos'
                    : 'Pattern analysis, not forecasts'
                },
                { 
                  icon: Users, 
                  title: locale === 'es' ? 'Acceso ciudadano' : 'Citizen Access',
                  text: locale === 'es' 
                    ? 'Democratizando información analítica'
                    : 'Democratizing analytical information'
                },
              ].map((item) => (
                <motion.div 
                  key={item.title}
                  variants={fadeInUp}
                  className="card p-5 flex items-start gap-4"
                >
                  <item.icon className="w-5 h-5 text-signal-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-umbral-muted">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Methodology */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-signal-blue/10 border border-signal-blue/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-signal-blue" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('about.methodology.title')}
              </h2>
            </div>

            <div className="card p-6 md:p-10 space-y-6">
              <p className="text-umbral-light leading-relaxed">
                {t('about.methodology.content')}
              </p>
              
              <div className="border-l-2 border-signal-teal pl-6 py-2">
                <p className="text-sm text-umbral-muted italic">
                  {locale === 'es'
                    ? '"Las probabilidades presentadas no son predicciones. Son estimaciones analíticas basadas en comparaciones históricas con otros episodios de transformación de régimen a nivel global."'
                    : '"The probabilities presented are not predictions. They are analytical estimates based on historical comparisons with other regime transformation episodes globally."'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-umbral-slate/30 rounded-lg">
                  <p className="text-3xl font-bold text-signal-teal font-mono mb-1">124+</p>
                  <p className="text-sm text-umbral-muted">
                    {locale === 'es' ? 'Años de datos' : 'Years of data'}
                  </p>
                </div>
                <div className="text-center p-4 bg-umbral-slate/30 rounded-lg">
                  <p className="text-3xl font-bold text-signal-amber font-mono mb-1">45+</p>
                  <p className="text-sm text-umbral-muted">
                    {locale === 'es' ? 'Eventos DEED' : 'DEED Events'}
                  </p>
                </div>
                <div className="text-center p-4 bg-umbral-slate/30 rounded-lg">
                  <p className="text-3xl font-bold text-signal-blue font-mono mb-1">5</p>
                  <p className="text-sm text-umbral-muted">
                    {locale === 'es' ? 'Escenarios monitoreados' : 'Monitored scenarios'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="section bg-umbral-charcoal/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 rounded-xl bg-signal-green/10 border border-signal-green/30 flex items-center justify-center">
                <Database className="w-6 h-6 text-signal-green" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('about.sources.title')}
              </h2>
            </motion.div>

            <div className="space-y-8">
              {/* Academic Sources */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-signal-teal" />
                  {t('about.sources.academic')}
                </h3>
                <div className="space-y-3">
                  {academicSources.map((source) => (
                    <a
                      key={source.name}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card p-4 flex items-start justify-between gap-4 group hover:border-umbral-steel transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-white group-hover:text-signal-teal transition-colors">
                          {source.name}
                        </h4>
                        <p className="text-sm text-umbral-muted mt-1">
                          {source.description}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-umbral-muted group-hover:text-signal-teal flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Media Sources */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-signal-amber" />
                  {t('about.sources.media')}
                </h3>
                <div className="card p-5">
                  <div className="flex flex-wrap gap-3">
                    {mediaSources.map((source) => (
                      <a
                        key={source.name}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-umbral-ash rounded-md text-sm text-umbral-light hover:text-signal-teal hover:bg-umbral-slate transition-colors"
                      >
                        {source.name}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Human Rights Sources */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-signal-red" />
                  {t('about.sources.humanRights')}
                </h3>
                <div className="card p-5">
                  <div className="flex flex-wrap gap-3">
                    {humanRightsSources.map((source) => (
                      <a
                        key={source.name}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-umbral-ash rounded-md text-sm text-umbral-light hover:text-signal-teal hover:bg-umbral-slate transition-colors"
                      >
                        {source.name}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="card p-6 md:p-10 border-signal-teal/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-signal-red/10 border border-signal-red/30 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-signal-red" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {t('about.acknowledgements.title')}
                </h2>
              </div>
              <p className="text-umbral-light leading-relaxed text-lg">
                {t('about.acknowledgements.content')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-t from-umbral-charcoal to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-umbral-muted mb-6">
              {locale === 'es'
                ? '¿Tienes preguntas sobre nuestros datos o metodología?'
                : 'Have questions about our data or methodology?'
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/reading-room" className="btn btn-primary px-6 py-2.5">
                {locale === 'es' ? 'Explorar Sala de Lectura' : 'Explore Reading Room'}
              </Link>
              <Link href="/how-did-we-get-here" className="btn btn-secondary px-6 py-2.5">
                {locale === 'es' ? 'Ver línea de tiempo' : 'View timeline'}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
