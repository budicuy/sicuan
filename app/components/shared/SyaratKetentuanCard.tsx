"use client";

import { HelpCircle } from "lucide-react";

export function SyaratKetentuanCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
      <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
        <HelpCircle className="w-4 h-4 text-primary-600" />
        Syarat &amp; Ketentuan
      </h4>
      <ul className="mt-3 space-y-2 text-xs text-neutral-600">
        <li className="flex gap-2">
          <span className="text-primary-600 font-bold shrink-0">•</span>
          <span>
            Diproses dalam <strong>1-2 hari kerja</strong>.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-primary-600 font-bold shrink-0">•</span>
          <span>
            Minimal pencairan <strong>Rp 10.000</strong>.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-primary-600 font-bold shrink-0">•</span>
          <span>Tanda tangan wajib diunggah.</span>
        </li>
        <li className="flex gap-2 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
          <span className="text-amber-600 font-bold shrink-0">•</span>
          <span>Tunai: dana diserahkan langsung. PDF dibuat admin.</span>
        </li>
      </ul>
    </div>
  );
}
