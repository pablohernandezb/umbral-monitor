'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, FileText, Eye, Cookie, Mail, AlertCircle } from 'lucide-react'
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

export default function PrivacyTermsPage() {
  const { locale } = useTranslation()

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
              {locale === 'es' ? 'Privacidad y Términos' : 'Privacy and Terms'}
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-umbral-muted max-w-2xl mx-auto"
            >
              {locale === 'es'
                ? 'Cómo protegemos tu información y los términos de uso de nuestra plataforma.'
                : 'How we protect your information and the terms of use for our platform.'
              }
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Last Updated */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-umbral-muted"
        >
          {locale === 'es' ? 'Última actualización: ' : 'Last updated: '}
          {new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </motion.div>
      </section>

      {/* Privacy Policy */}
      <section className="section">
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
              <div className="w-12 h-12 rounded-xl bg-signal-teal/10 border border-signal-teal/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-signal-teal" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {locale === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </h2>
            </motion.div>

            {/* Data Collection */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Eye className="w-5 h-5 text-signal-teal flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {locale === 'es' ? 'Información que Recopilamos' : 'Information We Collect'}
                  </h3>
                    <p className="text-umbral-light leading-relaxed mb-4">
                      {locale === 'es'
                        ? 'Umbral es una plataforma de visualización de datos públicos. Solo recopilamos información mínima y estrictamente necesaria cuando expertos contribuyen con análisis o cuando el público participa en encuestas o sondeos. Los datos que mostramos provienen de fuentes públicas y académicas verificadas.'
                        : 'Umbral is a public data visualization platform. We only collect minimal and strictly necessary information when experts contribute analysis or when the public participates in polls or surveys. The data we display comes from verified public and academic sources.'
                      }
                    </p>
                    <ul className="space-y-2 mb-4 text-sm text-umbral-light">
                      <li className="flex items-start gap-2">
                        <span className="text-signal-teal">•</span>
                        <span>
                          {locale === 'es'
                            ? 'Para análisis de expertos, recolectamos nombre, rol, institución y correo electrónico.'
                            : 'For experts analysis: we collect name, role, institution, and email address.'
                          }
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <span className="text-signal-teal">•</span>
                        <span>
                          {locale === 'es'
                            ? 'Encuestas y sondeos al público: únicamente correo electrónico'
                            : 'Public polls and surveys: email address only'
                          }
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <span className="text-signal-teal">•</span>
                        <span>
                          {locale === 'es'
                            ? 'No solicitamos registro de usuarios ni recopilamos datos personales adicionales o sensibles'
                            : 'We do not require user registration or collect additional or sensitive personal data'
                          }
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <span className="text-signal-teal">•</span>
                        <span>
                          {locale === 'es'
                            ? 'Usamos análisis anónimos y agregados para mejorar la plataforma'
                            : 'We use anonymous, aggregated analytics to improve the platform'
                          }
                        </span>
                      </li>
                    </ul>
                    <p className="text-umbral-light leading-relaxed mb-4">
                      {locale === 'es'
                        ? 'Los correos electrónicos recopilados se utilizan exclusivamente para los fines descritos y no se emplean con fines comerciales ni se comparten con terceros.'
                        : 'Collected email addresses are used exclusively for the purposes described and are not used for commercial purposes or shared with third parties.'
                      }
                    </p>
                </div>
              </div>
            </motion.div>

            {/* Cookies */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-5 h-5 text-signal-amber flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {locale === 'es' ? 'Cookies y Tecnologías Similares' : 'Cookies and Similar Technologies'}
                  </h3>
                  <p className="text-umbral-light leading-relaxed mb-4">
                    {locale === 'es'
                      ? 'Respetamos tu privacidad y tu derecho a controlar cómo se recopilan tus datos. Usamos los siguientes tipos de cookies:'
                      : 'We respect your privacy and your right to control how your data is collected. We use the following types of cookies:'
                    }
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">
                        {locale === 'es' ? 'Cookies Esenciales (Siempre Activas)' : 'Essential Cookies (Always Active)'}
                      </h4>
                      <p className="text-sm text-umbral-light leading-relaxed">
                        {locale === 'es'
                          ? 'Cookies necesarias para el funcionamiento básico del sitio, como preferencias de idioma y tu elección de consentimiento de cookies. Estas no pueden desactivarse.'
                          : 'Cookies necessary for basic site functionality, such as language preferences and your cookie consent choice. These cannot be disabled.'
                        }
                      </p>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">
                        {locale === 'es' ? 'Cookies Analíticas (Opcionales - Requieren Consentimiento)' : 'Analytics Cookies (Optional - Require Consent)'}
                      </h4>
                      <p className="text-sm text-umbral-light leading-relaxed mb-2">
                        {locale === 'es'
                          ? 'Utilizamos Google Analytics para entender cómo los visitantes interactúan con nuestra plataforma. Esto nos ayuda a:'
                          : 'We use Google Analytics to understand how visitors interact with our platform. This helps us:'
                        }
                      </p>
                      <ul className="space-y-1 text-sm text-umbral-light ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-signal-amber">•</span>
                          <span>
                            {locale === 'es'
                              ? 'Mejorar la experiencia del usuario'
                              : 'Improve user experience'
                            }
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-signal-amber">•</span>
                          <span>
                            {locale === 'es'
                              ? 'Identificar contenido más relevante'
                              : 'Identify most relevant content'
                            }
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-signal-amber">•</span>
                          <span>
                            {locale === 'es'
                              ? 'Comprender patrones de uso agregados'
                              : 'Understand aggregated usage patterns'
                            }
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-umbral-black/30 p-4 rounded-lg border border-signal-amber/20">
                      <p className="text-sm text-umbral-light leading-relaxed">
                        <strong className="text-white">
                          {locale === 'es' ? '🔒 Tu Control: ' : '🔒 Your Control: '}
                        </strong>
                        {locale === 'es'
                          ? 'Google Analytics solo se carga si das tu consentimiento explícito. Puedes aceptar o rechazar cookies analíticas cuando visitas el sitio por primera vez. Puedes cambiar tu decisión en cualquier momento haciendo clic en "Cookies" en el pie de página.'
                          : 'Google Analytics only loads if you give explicit consent. You can accept or reject analytics cookies when you first visit the site. You can change your decision at any time by clicking "Cookies" in the footer.'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-umbral-light leading-relaxed">
                        {locale === 'es'
                          ? 'No vendemos ni compartimos tu información personal con terceros. No utilizamos cookies de publicidad o seguimiento con fines comerciales.'
                          : 'We do not sell or share your personal information with third parties. We do not use advertising or tracking cookies for commercial purposes.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Data Security */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-5 h-5 text-signal-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {locale === 'es' ? 'Seguridad de los Datos' : 'Data Security'}
                  </h3>
                  <p className="text-umbral-light leading-relaxed">
                    {locale === 'es'
                      ? 'Todos los datos presentados en la plataforma son públicos y provienen de fuentes verificables. Implementamos medidas de seguridad estándar de la industria para proteger la integridad de nuestros servicios.'
                      : 'All data presented on the platform is public and comes from verifiable sources. We implement industry-standard security measures to protect the integrity of our services.'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Terms of Service */}
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
              <div className="w-12 h-12 rounded-xl bg-signal-blue/10 border border-signal-blue/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-signal-blue" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {locale === 'es' ? 'Términos de Servicio' : 'Terms of Service'}
              </h2>
            </motion.div>

            {/* Acceptance */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">
                {locale === 'es' ? '1. Aceptación de Términos' : '1. Acceptance of Terms'}
              </h3>
              <p className="text-umbral-light leading-relaxed">
                {locale === 'es'
                  ? 'Al acceder y usar Umbral, aceptas estos términos de servicio. Si no estás de acuerdo con algún término, por favor no uses la plataforma.'
                  : 'By accessing and using Umbral, you accept these terms of service. If you disagree with any term, please do not use the platform.'
                }
              </p>
            </motion.div>

            {/* Use of Service */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">
                {locale === 'es' ? '2. Uso del Servicio' : '2. Use of Service'}
              </h3>
              <p className="text-umbral-light leading-relaxed mb-4">
                {locale === 'es'
                  ? 'Umbral es una plataforma de información pública y análisis. Al usarla, te comprometes a:'
                  : 'Umbral is a public information and analysis platform. By using it, you agree to:'
                }
              </p>
              <ul className="space-y-2 text-sm text-umbral-light">
                <li className="flex items-start gap-2">
                  <span className="text-signal-teal mt-1">•</span>
                  <span>
                    {locale === 'es'
                      ? 'Usar la plataforma solo con fines académicos e informativos'
                      : 'Use the platform only for academic and informational purposes'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-teal mt-1">•</span>
                  <span>
                    {locale === 'es'
                      ? 'No intentar acceder a sistemas o datos no autorizados'
                      : 'Not attempt to access unauthorized systems or data'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-signal-teal mt-1">•</span>
                  <span>
                    {locale === 'es'
                      ? 'Respetar los derechos de propiedad intelectual'
                      : 'Respect intellectual property rights'
                    }
                  </span>
                </li>
              </ul>
            </motion.div>

            {/* Content and Sources */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">
                {locale === 'es' ? '3. Contenido y Fuentes' : '3. Content and Sources'}
              </h3>
              <p className="text-umbral-light leading-relaxed">
                {locale === 'es'
                  ? 'Toda la información presentada proviene de fuentes públicas verificables. Los análisis y probabilidades son estimaciones analíticas, no predicciones. Umbral no se hace responsable de decisiones tomadas basándose en esta información.'
                  : 'All information presented comes from verifiable public sources. Analyses and probabilities are analytical estimates, not predictions. Umbral is not responsible for decisions made based on this information.'
                }
              </p>
            </motion.div>

            {/* Disclaimer */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8 mb-6">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {locale === 'es' ? '4. Descargo de Responsabilidad' : '4. Disclaimer'}
                  </h3>
                  <p className="text-umbral-light leading-relaxed">
                    {locale === 'es'
                      ? 'La plataforma se proporciona "tal cual" sin garantías de ningún tipo. Umbral no garantiza la exactitud, integridad o actualidad de la información de terceros. El uso de esta plataforma es bajo tu propio riesgo.'
                      : 'The platform is provided "as is" without warranties of any kind. Umbral does not guarantee the accuracy, completeness, or timeliness of information by third parties. Use of this platform is at your own risk.'
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Changes */}
            <motion.div variants={fadeInUp} className="card p-6 md:p-8">
              <h3 className="text-xl font-semibold text-white mb-3">
                {locale === 'es' ? '5. Cambios a los Términos' : '5. Changes to Terms'}
              </h3>
              <p className="text-umbral-light leading-relaxed">
                {locale === 'es'
                  ? 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en esta página.'
                  : 'We reserve the right to modify these terms at any time. Changes will take effect immediately upon posting on this page.'
                }
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="card p-6 md:p-8 text-center">
              <Mail className="w-8 h-8 text-signal-teal mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-3">
                {locale === 'es' ? '¿Preguntas?' : 'Questions?'}
              </h3>
              <p className="text-umbral-light mb-4">
                {locale === 'es'
                  ? 'Si tienes preguntas sobre nuestra política de privacidad o términos de servicio, contáctanos:'
                  : 'If you have questions about our privacy policy or terms of service, contact us:'
                }
              </p>
              <a
                href="mailto:hi@pablohernandezb.dev"
                className="text-signal-teal hover:underline font-medium"
              >
                hi@pablohernandezb.dev
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
