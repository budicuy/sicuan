"use client";

import {
  type MediaItem,
  MediaSlider,
} from "@/app/components/shared/MediaSlider";

interface VideoBannerProps {
  videoUrl?: string | null;
  items?: MediaItem[];
  judul?: string | null;
  deskripsi?: string | null;
  className?: string;
  autoPlay?: boolean;
}

export function VideoBanner({
  videoUrl,
  items,
  className = "",
  autoPlay = true,
}: VideoBannerProps) {
  // If multiple items provided, use them
  if (items && items.length > 0) {
    return (
      <MediaSlider items={items} className={className} autoPlay={autoPlay} />
    );
  }

  // Fallback for single video
  if (videoUrl) {
    const singleItem: MediaItem = {
      id: 1,
      tipe: "video",
      mediaUrl: videoUrl,
    };
    return (
      <MediaSlider
        items={[singleItem]}
        className={className}
        autoPlay={autoPlay}
      />
    );
  }

  return null;
}
