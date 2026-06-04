"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Hapus",
  message,
  confirmLabel = "Ya, Hapus",
  isPending = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden p-6 relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="p-3 rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="w-12 h-12 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 border-0"
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {isPending ? "Menghapus..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
