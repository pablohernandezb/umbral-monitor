'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-9 h-9 rounded-md border border-teal-500/30 bg-[#111113]/90 text-teal-400 backdrop-blur-sm shadow-lg hover:border-teal-400/60 hover:bg-teal-500/10 hover:text-teal-300 transition-colors"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
