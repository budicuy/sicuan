"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { FAQS } from "@/app/components/landing-page/shared-data";

interface FaqSectionProps {
  faqOpen: number | null;
  setFaqOpen: (i: number | null) => void;
}

export function FaqSection({ faqOpen, setFaqOpen }: FaqSectionProps) {
  return (
    <section id="faq" className="py-24 bg-primary-50/10 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Pertanyaan Umum
          </h2>
          <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h3>
          <p className="text-neutral-500">
            Temukan jawaban atas pertanyaan seputar mekanisme setoran, reward
            poin kupon, pencairan saldo, dan integrasi kemitraan SICUAN.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = faqOpen === i;
            return (
              <div
                key={faq.q}
                className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-neutral-850 hover:bg-neutral-50/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-primary-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-500" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 animate-slide-down">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
