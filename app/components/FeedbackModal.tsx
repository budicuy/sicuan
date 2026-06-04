"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
  autoCloseMs?: number;
}

export function FeedbackModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoCloseMs = 3000,
}: FeedbackModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoCloseMs]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden p-6 relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className={`p-3 rounded-full ${
              isSuccess
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-12 h-12 stroke-[1.5]" />
            ) : (
              <AlertCircle className="w-12 h-12 stroke-[1.5]" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-xs font-semibold shadow-sm transition-all border-0 cursor-pointer ${
              isSuccess
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
