import React, { forwardRef, useMemo } from 'react';

type Props = {
  src?: string;
  poster?: string;
  hint?: boolean;
  onLog?: (msg: string) => void;
} & React.VideoHTMLAttributes<HTMLVideoElement>;

const StoryPlayer = forwardRef<HTMLVideoElement, Props>(
  ({ src, poster, hint, onLog, ...rest }, ref) => {
    const typeHint = useMemo(() => {
      const u = src || '';
      if (/\.mp4(\?|#|$)/i.test(u)) return 'video/mp4';
      if (/\.webm(\?|#|$)/i.test(u)) return 'video/webm';
      return undefined;
    }, [src]);

    return (
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        defaultMuted
        disablePictureInPicture
        controls={hint}
        controlsList="nodownload noplaybackrate nofullscreen"
        preload={rest.preload || 'auto'}
        poster={poster}
        {...rest}
      >
        {src ? (
          <source src={src} {...(typeHint ? { type: typeHint } : {})} />
        ) : null}
      </video>
    );
  }
);

export default StoryPlayer;
