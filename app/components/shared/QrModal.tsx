"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponName: string;
  uniqueCode: string;
  poin: number;
  status: string;
  deskripsi: string;
}

export function QrModal({
  isOpen,
  onClose,
  couponName,
  uniqueCode,
  poin,
  status,
  deskripsi,
}: QrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Create validation URL targeting validator verification view
      const protocol = window.location.protocol;
      const host = window.location.host;
      const validationUrl = `${protocol}//${host}/kupon-validasi?code=${uniqueCode}`;

      QRCode.toCanvas(
        canvasRef.current,
        validationUrl,
        {
          width: 200,
          margin: 1,
          color: {
            dark: "#0f172a", // neutral-900 slate
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("Error rendering QR code:", error);
        },
      );
    }
  }, [isOpen, uniqueCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-neutral-200 overflow-hidden animate-scale-up relative">
        {/* Top colored indicator bar */}
        <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500 w-full" />

        <div className="p-6 space-y-5 text-center">
          {/* Header check icon */}
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            ✓
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-neutral-900 uppercase">
              KUPON REWARD AKTIF
            </h3>
            <p className="text-[10px] text-neutral-450 leading-relaxed max-w-[280px] mx-auto">
              Tunjukkan QR Code ini ke petugas atau merchant untuk memverifikasi
              dan menggunakan reward Anda.
            </p>
          </div>

          {/* QR Container */}
          <div className="bg-neutral-50/80 border border-neutral-200/60 p-4 rounded-3xl w-fit mx-auto relative flex flex-col items-center gap-3">
            <div className="bg-white p-2 rounded-2xl border border-neutral-100 shadow-sm">
              <canvas ref={canvasRef} className="w-44 h-44" />
            </div>
            <span className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-[10px] font-mono font-extrabold text-neutral-700 tracking-wider">
              {uniqueCode}
            </span>
          </div>

          {/* Details List */}
          <div className="text-left space-y-3.5 border-t border-dashed border-neutral-200 pt-4">
            <div>
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">
                NAMA REWARD
              </span>
              <span className="text-sm font-black text-neutral-800 block mt-0.5">
                {couponName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">
                  BIAYA POIN
                </span>
                <span className="text-xs font-bold font-mono text-neutral-700 block mt-0.5">
                  💰 {poin} Poin
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">
                  STATUS KUPON
                </span>
                <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  {status}
                </span>
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3">
              <span className="text-[9px] font-bold text-neutral-405 uppercase tracking-wider block mb-1">
                KETENTUAN & PENJELASAN BARANG
              </span>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                {deskripsi}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Link
              href={`/kupon-validasi?code=${uniqueCode}`}
              target="_blank"
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0 no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Uji Halaman Validasi Kupon
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-2xl text-xs font-bold transition-all cursor-pointer border-0"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
