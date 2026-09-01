"use client";

import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface MediaItem {
  id: number;
  tipe: string; // 'video' | 'gambar'
  mediaUrl?: string | null;
  videoUrl?: string | null;
}

interface MediaSliderProps {
  items: MediaItem[];
  className?: string;
  autoPlay?: boolean;
}

export function MediaSlider({
  items = [],
  className = "",
  autoPlay = true,
}: MediaSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  // Default suara video: ON (isMuted: false)
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedMedia, setLoadedMedia] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Load sound setting from localStorage on mount
  useEffect(() => {
    try {
      const savedMuted = localStorage.getItem("sicuan_video_muted");
      if (savedMuted !== null) {
        setIsMuted(savedMuted === "true");
      } else {
        setIsMuted(false); // default ON
      }
    } catch {
      // ignore
    }
  }, []);

  // Filter valid media items
  const validItems = items.filter((item) =>
    Boolean(item.mediaUrl || item.videoUrl),
  );

  // Sync fullscreen state with native document fullscreen events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element })
            .webkitFullscreenElement,
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  const currentItem = validItems[currentIndex];
  const isCurrentVideo = currentItem?.tipe === "video";
  const isCurrentLoaded = Boolean(currentItem && loadedMedia[currentItem.id]);

  // Handle playing the current video when slide changes
  useEffect(() => {
    if (!currentItem) return;

    if (currentItem.tipe === "video") {
      const vid = videoRefs.current.get(currentItem.id);
      if (vid) {
        vid.muted = isMuted;
        if (autoPlay) {
          vid
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              // Jika browser memblokir autoplay dengan suara sebelum ada interaksi,
              // lakukan fallback mute sementara agar video tetap berputar
              if (err?.name === "NotAllowedError" && !isMuted) {
                vid.muted = true;
                vid
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch(() => setIsPlaying(false));
              } else {
                setIsPlaying(false);
              }
            });
        }
      }
    }

    // Pause other videos
    videoRefs.current.forEach((vid, id) => {
      if (id !== currentItem.id) {
        vid.pause();
      }
    });
  }, [currentItem, isMuted, autoPlay]);

  const paginate = useCallback(
    (newDirection: number) => {
      if (validItems.length <= 1) return;
      setDirection(newDirection);
      setCurrentIndex((prev) => {
        let nextIndex = prev + newDirection;
        if (nextIndex < 0) nextIndex = validItems.length - 1;
        if (nextIndex >= validItems.length) nextIndex = 0;
        return nextIndex;
      });
    },
    [validItems.length],
  );

  const togglePlay = () => {
    if (!currentItem || currentItem.tipe !== "video") return;
    const vid = videoRefs.current.get(currentItem.id);
    if (!vid) return;

    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try {
      localStorage.setItem("sicuan_video_muted", String(newMuted));
    } catch {
      // ignore
    }

    if (currentItem && currentItem.tipe === "video") {
      const vid = videoRefs.current.get(currentItem.id);
      if (vid) {
        vid.muted = newMuted;
        if (!newMuted && vid.paused) {
          vid
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      }
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => {
          console.error("Fullscreen error:", err);
        });
      } else if (
        (container as unknown as { webkitRequestFullscreen?: () => void })
          .webkitRequestFullscreen
      ) {
        (
          container as unknown as { webkitRequestFullscreen: () => void }
        ).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (
        (document as unknown as { webkitExitFullscreen?: () => void })
          .webkitExitFullscreen
      ) {
        (
          document as unknown as { webkitExitFullscreen: () => void }
        ).webkitExitFullscreen();
      }
    }
  };

  if (validItems.length === 0) {
    return null;
  }

  // Swipe handlers for mobile / touch
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    { offset, velocity }: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -100 || offset.x < -60) {
      paginate(1); // Swipe left -> Next
    } else if (swipe > 100 || offset.x > 60) {
      paginate(-1); // Swipe right -> Prev
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      position: "relative" as const,
      width: "100%",
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
    }),
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-md border border-neutral-800/80 select-none group ${className}`}
    >
      {/* Dynamic Auto Height Container */}
      <div
        className={`relative w-full overflow-hidden bg-neutral-950 flex items-center justify-center ${
          isFullscreen ? "h-full min-h-screen" : "h-auto"
        }`}
      >
        {/* Animated Carousel Slide */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentItem.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 350, damping: 35 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            className="w-full h-auto flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {currentItem.tipe === "video" ? (
              <div className="relative w-full aspect-video flex items-center justify-center bg-neutral-950 overflow-hidden">
                {/* Preload Blur & Shimmer Placeholder */}
                {!isCurrentLoaded && (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-900/90 backdrop-blur-xl z-10 pointer-events-none">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                    <div className="w-9 h-9 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                  </div>
                )}
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(currentItem.id, el);
                    else videoRefs.current.delete(currentItem.id);
                  }}
                  src={currentItem.mediaUrl || currentItem.videoUrl || ""}
                  playsInline
                  loop
                  muted={isMuted}
                  autoPlay={autoPlay}
                  preload="auto"
                  onLoadedData={() => {
                    setLoadedMedia((prev) => ({
                      ...prev,
                      [currentItem.id]: true,
                    }));
                  }}
                  onCanPlay={() => {
                    setLoadedMedia((prev) => ({
                      ...prev,
                      [currentItem.id]: true,
                    }));
                  }}
                  onClick={togglePlay}
                  className={`w-full h-full cursor-pointer transition-all duration-700 ease-out ${
                    isCurrentLoaded
                      ? "blur-none scale-100 opacity-100"
                      : "blur-xl scale-105 opacity-30"
                  } ${isFullscreen ? "object-contain" : "object-cover"}`}
                />
              </div>
            ) : (
              <div className="relative w-full h-auto flex items-center justify-center bg-neutral-950 overflow-hidden">
                {/* Preload Blur & Shimmer Placeholder */}
                {!isCurrentLoaded && (
                  <div className="absolute inset-0 w-full h-full min-h-[220px] flex items-center justify-center bg-neutral-900/90 backdrop-blur-xl z-10 pointer-events-none">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                    <div className="w-9 h-9 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                  </div>
                )}
                <Image
                  src={currentItem.mediaUrl || currentItem.videoUrl || ""}
                  alt="Slide Media SICUAN"
                  width={1200}
                  height={800}
                  sizes="(max-width: 768px) 100vw, 800px"
                  onLoad={() => {
                    setLoadedMedia((prev) => ({
                      ...prev,
                      [currentItem.id]: true,
                    }));
                  }}
                  className={`w-full h-auto block object-contain pointer-events-none select-none transition-all duration-700 ease-out ${
                    isCurrentLoaded
                      ? "blur-none scale-100 opacity-100"
                      : "blur-xl scale-105 opacity-30"
                  } ${isFullscreen ? "max-h-screen" : ""}`}
                  priority
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Instagram-Style Counter Badge (Top Left) */}
        {validItems.length > 1 && (
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white/90 shadow-md pointer-events-none">
            {currentIndex + 1}/{validItems.length}
          </div>
        )}

        {/* Floating Controls (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          {/* Mute/Unmute Toggle (Only for Video) */}
          {isCurrentVideo && (
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:scale-105 shadow-md flex items-center justify-center"
              title={isMuted ? "Bunyikan Suara" : "Matikan Suara"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          )}

          {/* Play/Pause Toggle (Only for Video) */}
          {isCurrentVideo && (
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:scale-105 shadow-md flex items-center justify-center"
              title={isPlaying ? "Jeda Video" : "Putar Video"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Fullscreen Toggle (Available on both mobile and desktop) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:scale-105 shadow-md flex items-center justify-center"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Instagram-Style Navigation Arrows (Left & Right) */}
        {validItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Slide sebelumnya"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Slide berikutnya"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Instagram-Style Pagination Dots (Bottom Center) */}
        {validItems.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
            {validItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? "w-4 bg-white shadow-xs"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Buka slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
