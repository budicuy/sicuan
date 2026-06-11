"use client";

import type React from "react";
import { useEffect } from "react";
import { usePageTransition } from "@/app/components/shared/PageTransitionProvider";

export default function Template({ children }: { children: React.ReactNode }) {
  const { notifyPageMounted } = usePageTransition();

  useEffect(() => {
    notifyPageMounted();
  }, [notifyPageMounted]);

  return <>{children}</>;
}
