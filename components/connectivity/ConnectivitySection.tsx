// components/connectivity/ConnectivitySection.tsx
// Tabbed wrapper that holds Internet Connectivity (IODA) and Domain Blocking
// in the same section on the landing page.
'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';
import type { BlockedDomain } from '@/types';

// Import your existing merged IODA dashboard
import { IodaDashboard } from '@/components/ioda/IodaDashboard';
// Import the new blocking dashboard
import BlockingDashboard from '@/components/blocking/BlockingDashboard';

interface Props {
  /** Blocked domains data for the blocking tab */
  blockingData: BlockedDomain[];
  /** Reserved for future IODA props — unused currently */
  iodaProps?: Record<string, never>;
}

const TABS = ['connectivity', 'blocking'] as const;
type TabKey = (typeof TABS)[number];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ConnectivitySection({
  blockingData,
}: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('connectivity');

  return (
    <section id="internet-connectivity" className="mt-8">
      {/* Section heading — matches original IODA heading style */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        className="text-center mb-8"
      >
        <h2 className="section-title mb-4 flex items-center justify-center gap-3">
          <Wifi className="w-7 h-7 text-signal-teal" />
          {t('ioda.sectionTitle')}
        </h2>
        <p className="section-subtitle mx-auto">
          {t('ioda.sectionSubtitle')}
        </p>
      </motion.div>

      {/* Tab bar — pill badge buttons */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-1.5 rounded-full font-display text-[13px] font-medium tracking-wide
              border transition-all duration-200 cursor-pointer
              ${
                activeTab === tab
                  ? 'bg-teal-500/15 border-teal-500/50 text-teal-300'
                  : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
              }
            `}
          >
            {t(`connectivity.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'connectivity' && (
          <motion.div
            key="connectivity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <IodaDashboard />
          </motion.div>
        )}

        {activeTab === 'blocking' && (
          <motion.div
            key="blocking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <BlockingDashboard data={blockingData} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
