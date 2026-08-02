import { useEffect, useState } from "react";
import { PictureOutlined } from "@ant-design/icons";

interface ThumbnailProps {
  src: string | null;
  alt: string;
  className?: string;
}

/** The cover image of a reflection, served by the blog. Reflections written
 * before the image step existed (and any image that fails to load) fall back
 * to a neutral placeholder instead of a broken image. */
export function Thumbnail({ src, alt, className = "" }: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-bg-hover text-text-muted ${className}`}
      >
        <PictureOutlined />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded object-cover ${className}`}
    />
  );
}
