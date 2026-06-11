"use client";

import { Recycle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const TransitionContext = createContext<{
  transitionTo: (href: string) => void;
  notifyPageMounted: () => void;
  isTransitioning: boolean;
}>({
  transitionTo: () => {},
  notifyPageMounted: () => {},
  isTransitioning: false,
});

export const usePageTransition = () => useContext(TransitionContext);

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "in" | "out">("idle");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);

  const transitionTo = (href: string) => {
    setPendingHref(href);
    setPageReady(false);
    setStatus("in");
  };

  const notifyPageMounted = useCallback(() => {
    setPageReady(true);
  }, []);

  // Prevent scroll shifting and horizontal scrollbar bounce on mobile during transition
  useEffect(() => {
    if (status !== "idle") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [status]);

  // When both the curtain has closed ("in") and the new page is ready ("pageReady"), slide out
  useEffect(() => {
    if (status === "in" && pageReady) {
      setStatus("out");
    }
  }, [status, pageReady]);

  // Fallback safety timeout (4 seconds) to prevent getting stuck if notifyPageMounted is not called
  useEffect(() => {
    if (status === "in" && !pageReady) {
      const timer = setTimeout(() => {
        setPageReady(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, pageReady]);

  return (
    <TransitionContext.Provider
      value={{
        transitionTo,
        notifyPageMounted,
        isTransitioning: status !== "idle",
      }}
    >
      {children}
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div
            key="transition-curtain"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{
              clipPath:
                status === "in" ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
            }}
            exit={{ clipPath: "inset(0 0 0 100%)" }}
            transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={() => {
              if (status === "in") {
                if (pendingHref) {
                  router.push(pendingHref);
                }
              } else if (status === "out") {
                setStatus("idle");
                setPendingHref(null);
              }
            }}
            className="fixed inset-0 bg-primary-900 z-[99999] flex items-center justify-center pointer-events-auto"
          >
            <div className="flex items-center gap-4 text-left select-none">
              {/* Logo Icon */}
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30">
                <Recycle className="w-8 h-8 animate-spin-slow" />
              </div>
              {/* Text Group */}
              <div className="flex flex-col items-start justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white leading-none">
                    SICUAN
                  </span>
                  <span className="text-[10px] bg-primary-900/50 text-primary-200 px-3 py-0.5 rounded-full font-medium border border-primary-500/40">
                    Official Portal
                  </span>
                </div>
                <p className="text-[10px] text-primary-300 font-bold tracking-wider uppercase mt-1.5 leading-none">
                  PT. INDOFOOD CBP SUKSES MAKMUR TBK
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function TransitionLink({
  href,
  children,
  className,
  id,
  onClick,
  ...props
}: TransitionLinkProps) {
  const { transitionTo } = usePageTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    e.preventDefault();
    transitionTo(href.toString());
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      id={id}
      {...props}
    >
      {children}
    </Link>
  );
}
