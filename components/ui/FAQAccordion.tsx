'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  items: FAQItem[]
  className?: string
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="card overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-umbral-slate/30 transition-colors"
          >
            <span className="text-base font-medium text-white">
              {item.question}
            </span>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-umbral-muted flex-shrink-0 transition-transform duration-200',
                openIndex === index && 'rotate-180'
              )}
            />
          </button>
          
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === index ? 'max-h-96' : 'max-h-0'
            )}
          >
            <div className="px-5 pb-4 pt-0">
              <p className="text-sm text-umbral-muted leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
