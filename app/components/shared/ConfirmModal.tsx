"use client";

import { AlertTriangle, Gift, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  variant?: "danger" | "success" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  isPending = false,
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Variant styles mapping
  const variantStyles = {
    danger: {
      iconBg: "bg-red-50 text-red-500",
      icon: <AlertTriangle className="w-12 h-12 stroke-[1.5]" />,
      btnClass:
        "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-red-600/20",
      btnIcon: <Trash2 className="w-3.5 h-3.5" />,
      defaultTitle: "Konfirmasi Hapus",
      defaultConfirmLabel: "Ya, Hapus",
      pendingLabel: "Menghapus...",
    },
    success: {
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: <Gift className="w-12 h-12 stroke-[1.5]" />,
      btnClass:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/20",
      btnIcon: <Gift className="w-3.5 h-3.5" />,
      defaultTitle: "Konfirmasi Penukaran",
      defaultConfirmLabel: "Ya, Tukar",
      pendingLabel: "Memproses...",
    },
    primary: {
      iconBg: "bg-primary-50 text-primary-600",
      icon: <AlertTriangle className="w-12 h-12 stroke-[1.5]" />,
      btnClass:
        "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-primary-600/20",
      btnIcon: <Gift className="w-3.5 h-3.5" />,
      defaultTitle: "Konfirmasi Tindakan",
      defaultConfirmLabel: "Ya, Setuju",
      pendingLabel: "Memproses...",
    },
  };

  const style = variantStyles[variant];
  const finalTitle = title || style.defaultTitle;
  const finalConfirmLabel = confirmLabel || style.defaultConfirmLabel;

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
          <div className={`p-3 rounded-full ${style.iconBg}`}>{style.icon}</div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">
              {finalTitle}
            </h3>
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
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 border-0 ${style.btnClass}`}
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                style.btnIcon
              )}
              {isPending ? style.pendingLabel : finalConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
