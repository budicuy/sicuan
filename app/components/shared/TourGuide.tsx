"use client";

import { driver } from "driver.js";
import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";

interface TourStep {
  element?: string | Element;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    onNextClick?: (
      element: Element | undefined,
      step: unknown,
      options: unknown,
    ) => void;
  };
  onHighlighted?: (
    element: Element | undefined,
    step: unknown,
    options: unknown,
  ) => void;
}

interface TourGuideProps {
  steps: TourStep[];
  onStart?: () => void;
  onEnd?: () => void;
}

export function TourGuide({ steps, onStart, onEnd }: TourGuideProps) {
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const stepsRef = useRef(steps);

  // Keep refs updated with latest props
  useEffect(() => {
    onStartRef.current = onStart;
    onEndRef.current = onEnd;
    stepsRef.current = steps;
  }, [onStart, onEnd, steps]);

  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      allowClose: false,
      nextBtnText: "Lanjut →",
      prevBtnText: "← Kembali",
      doneBtnText: "Selesai ✔",
      steps: stepsRef.current.map((s) => {
        const popoverConfig: {
          title: string;
          description: string;
          side?: "top" | "right" | "bottom" | "left";
          align?: "start" | "center" | "end";
          onNextClick?: (
            element: Element | undefined,
            step: unknown,
            options: unknown,
          ) => void;
        } = {
          title: s.popover.title,
          description: s.popover.description,
          side: s.popover.side,
          align: s.popover.align,
        };

        if (s.popover.onNextClick) {
          popoverConfig.onNextClick = s.popover.onNextClick;
        }

        const stepConfig: {
          element?: string | Element;
          popover: typeof popoverConfig;
          onHighlighted?: (
            element: Element | undefined,
            step: unknown,
            options: unknown,
          ) => void;
        } = {
          element: s.element,
          popover: popoverConfig,
        };

        if (s.onHighlighted) {
          stepConfig.onHighlighted = s.onHighlighted;
        }

        return stepConfig;
      }),
      onDestroyed: () => {
        onEndRef.current?.();
      },
    });

    const startTour = () => {
      onStartRef.current?.();
      // Memberikan waktu agar state data demo di parent component ter-render
      setTimeout(() => {
        driverObj.drive();
      }, 150);
    };

    const handleManualTrigger = () => {
      startTour();
    };

    const handleCloseTrigger = () => {
      try {
        driverObj.destroy();
      } catch (_err) {
        // ignore
      }
    };

    document.addEventListener("trigger-tour-guide", handleManualTrigger);
    document.addEventListener("close-tour-guide", handleCloseTrigger);

    return () => {
      document.removeEventListener("trigger-tour-guide", handleManualTrigger);
      document.removeEventListener("close-tour-guide", handleCloseTrigger);
      try {
        driverObj.destroy();
      } catch (_err) {
        // ignore
      }
    };
  }, []);

  return null;
}
