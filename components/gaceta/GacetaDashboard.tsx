// components/gaceta/GacetaDashboard.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/i18n';
import { ScrollText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GacetaRecord } from '@/types';
import { computeGacetaSummary } from './gaceta-utils';
import ResumenTab from './ResumenTab';
import DesignacionesTab from './DesignacionesTab';
import MilitaresTab from './MilitaresTab';
import InstitucionesTab from './InstitucionesTab';
import BuscadorTab from './BuscadorTab';

interface Props {
  records: GacetaRecord[];
}

const TABS = ['resumen', 'designaciones', 'militares', 'instituciones', 'buscador'] as const;
type TabKey = (typeof TABS)[number];

export default function GacetaDashboard({ records }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');

  const summary = useMemo(() => computeGacetaSummary(records), [records]);

  const lastDate = useMemo(() => {
    if (records.length === 0) return null;
    return records.reduce((latest, r) => (r.gazette_date > latest ? r.gazette_date : latest), '');
  }, [records]);

  return (
    <div className="rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ScrollText className="w-4 h-4 text-signal-teal" />
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              {t('gaceta.panelTitle')}
            </h3>
            <p className="text-[10px] text-umbral-muted mt-0.5">
              {t('gaceta.panelSubtitle')}
            </p>
          </div>
        </div>
        <a
          href="http://www.gacetaoficial.gob.ve"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-signal-teal hover:underline shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          {t('gaceta.source')}
        </a>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-4 md:px-6 pt-4 flex gap-2 flex-wrap">
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
            {t(`gaceta.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'resumen' && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ResumenTab records={records} summary={summary} />
            </motion.div>
          )}

          {activeTab === 'designaciones' && (
            <motion.div
              key="designaciones"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DesignacionesTab records={records} />
            </motion.div>
          )}

          {activeTab === 'militares' && (
            <motion.div
              key="militares"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MilitaresTab records={records} />
            </motion.div>
          )}

          {activeTab === 'instituciones' && (
            <motion.div
              key="instituciones"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <InstitucionesTab records={records} />
            </motion.div>
          )}

          {activeTab === 'buscador' && (
            <motion.div
              key="buscador"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <BuscadorTab records={records} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-[10px] font-mono text-umbral-muted px-4 md:px-6 py-3 border-t border-umbral-ash/30">
        <span>{t('common.source')}: {t('gaceta.source')}</span>
        <span>
          {lastDate
            ? `${t('common.lastUpdated')}: ${lastDate}`
            : '—'}
        </span>
      </div>

    </div>
  );
}
