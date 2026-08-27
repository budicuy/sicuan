"use client";

import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VideoBannerProps {
  videoUrl?: string | null;
  judul?: string | null;
  deskripsi?: string | null;
  className?: string;
  autoPlay?: boolean;
}

export function VideoBanner({
  videoUrl,
  judul,
  deskripsi,
  className = "",
  autoPlay = true,
}: VideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [_isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    if (videoRef.current) {
      if (autoPlay) {
        videoRef.current.muted = true;
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay waiting for user interaction:", err);
            setIsPlaying(false);
          });
      }
    }
  }, [autoPlay]);

  if (!videoUrl) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
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
      } else if (
        (video as unknown as { webkitEnterFullscreen?: () => void })
          ?.webkitEnterFullscreen
      ) {
        // Fallback for iOS Safari
        (
          video as unknown as { webkitEnterFullscreen: () => void }
        ).webkitEnterFullscreen();
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

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-lg border border-neutral-800 group ${className}`}
    >
      {/* Video Element (16:9 Aspect Ratio) */}
      <div
        className={`relative w-full bg-neutral-950 flex items-center justify-center overflow-hidden ${
          isFullscreen ? "h-full min-h-screen" : "aspect-video"
        }`}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          loop
          muted={isMuted}
          autoPlay={autoPlay}
          onLoadedData={() => setIsLoaded(true)}
          onClick={togglePlay}
          className={`w-full h-full cursor-pointer ${
            isFullscreen ? "object-contain" : "object-cover"
          }`}
        />

        {/* Gradient & Text Overlay (Hidden during Fullscreen) */}
        {!isFullscreen && (
          <>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Title and Description Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col justify-end pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary-600/90 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  <Sparkles className="w-3 h-3" /> Info &amp; Edukasi
                </span>
              </div>

              {judul && (
                <h3 className="text-base sm:text-lg font-black text-white drop-shadow-md tracking-tight line-clamp-1">
                  {judul}
                </h3>
              )}

              {deskripsi && (
                <p className="text-xs text-neutral-200/90 drop-shadow-xs line-clamp-2 max-w-xl mt-0.5">
                  {deskripsi}
                </p>
              )}
            </div>
          </>
        )}

        {/* Floating Controls (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {/* Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:scale-105 shadow-md flex items-center justify-center"
            title={isMuted ? "Bunyikan Suara" : "Matikan Suara"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-amber-300" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Play/Pause Toggle */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:scale-105 shadow-md flex items-center justify-center"
            title={isPlaying ? "Jeda Video" : "Putar Video"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Fullscreen Toggle (Visible on both Mobile and Desktop) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:scale-105 shadow-md flex items-center justify-center"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
