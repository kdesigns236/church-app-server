import React, { useEffect, useRef } from 'react';
import {
  LowerThirdConfig,
  AnnouncementConfig,
  LyricsConfig,
  BibleVerseConfig,
} from './types';

interface ProgramOutputCanvasProps {
  sourceStream: MediaStream | null;
  lowerThirdConfig: LowerThirdConfig;
  announcementConfig: AnnouncementConfig;
  lyricsConfig: LyricsConfig;
  bibleVerseConfig: BibleVerseConfig;
  rotate90?: boolean;
  zoomScale?: number | null;
  onProgramStreamReady: (stream: MediaStream | null) => void;
}

const hexToRgba = (hex: string, opacity: number) => {
  try {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${opacity})`;
  } catch {
    return `rgba(0,0,0,${opacity})`;
  }
};

const darken = (color: string, percent: number): string => {
  try {
    let num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const r = (num >> 16) - amt;
    const g = ((num >> 8) & 0x00ff) - amt;
    const b = (num & 0x0000ff) - amt;
    const newColor =
      '#' +
      (
        0x1000000 +
        (r < 255 ? (r < 1 ? 0 : r) : 255) * 0x10000 +
        (g < 255 ? (g < 1 ? 0 : g) : 255) * 0x100 +
        (b < 255 ? (b < 1 ? 0 : b) : 255)
      )
        .toString(16)
        .slice(1);
    return newColor;
  } catch {
    return color;
  }
};

const ProgramOutputCanvas: React.FC<ProgramOutputCanvasProps> = ({
  sourceStream,
  lowerThirdConfig,
  announcementConfig,
  lyricsConfig,
  bibleVerseConfig,
  rotate90,
  zoomScale,
  onProgramStreamReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const programStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let video = videoRef.current;
    if (!video) {
      video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      (video as any).playsInline = true;
      videoRef.current = video;
    }

    if (sourceStream) {
      video.srcObject = sourceStream;
      const play = async () => {
        try {
          await video!.play();
        } catch {
          // Ignore play errors
        }
      };
      play();
    } else if (video) {
      video.srcObject = null;
    }
  }, [sourceStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (programStreamRef.current) {
      programStreamRef.current.getTracks().forEach((t) => t.stop());
      programStreamRef.current = null;
    }

    const stream = canvas.captureStream(30);
    programStreamRef.current = stream;
    onProgramStreamReady(stream);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (programStreamRef.current) {
        programStreamRef.current.getTracks().forEach((t) => t.stop());
        programStreamRef.current = null;
      }
      onProgramStreamReady(null);
    };
  }, [onProgramStreamReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      if (video.readyState >= 2) {
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;

        const portrait = vw < vh;
        const baseRotate = portrait ? 90 : 0;
        const extraRotate = rotate90 ? 90 : 0;
        const totalRotate = baseRotate + extraRotate;
        const normalized = ((totalRotate % 360) + 360) % 360;
        const rotated = normalized === 90 || normalized === 270;

        const displayW = rotated ? vh : vw;
        const displayH = rotated ? vw : vh;

        const scaleX = width / displayW;
        const scaleY = height / displayH;
        const coverScale = Math.max(scaleX, scaleY);
        const zoom = zoomScale && zoomScale > 1 ? zoomScale : 1;
        const totalScale = coverScale * zoom;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        if (normalized !== 0) {
          ctx.rotate((normalized * Math.PI) / 180);
        }
        ctx.scale(totalScale, totalScale);
        ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
        ctx.restore();
      }

      if (announcementConfig.isVisible && announcementConfig.text) {
        const padding = 40;
        const boxHeight = 140;
        const y =
          announcementConfig.position === 'top'
            ? padding
            : announcementConfig.position === 'middle'
            ? height / 2 - boxHeight / 2
            : height - boxHeight - padding;

        ctx.save();
        ctx.fillStyle = hexToRgba(announcementConfig.backgroundColor, announcementConfig.backgroundOpacity);
        ctx.fillRect(padding, y, width - padding * 2, boxHeight);
        ctx.fillStyle = announcementConfig.textColor || '#ffffff';
        ctx.font = '32px system-ui, sans-serif';
        ctx.textAlign = announcementConfig.textAlign;
        const textX =
          announcementConfig.textAlign === 'left'
            ? padding + 20
            : announcementConfig.textAlign === 'right'
            ? width - padding - 20
            : width / 2;
        ctx.textBaseline = 'middle';
        ctx.fillText(announcementConfig.text, textX, y + boxHeight / 2, width - padding * 3);
        ctx.restore();
      }

      if (lyricsConfig.isVisible && lyricsConfig.song && lyricsConfig.song.verses.length > 0) {
        const padding = 40;
        const boxHeight = 180;
        const text = lyricsConfig.song.verses[lyricsConfig.verseIndex] || '';
        const y =
          lyricsConfig.position === 'top'
            ? padding
            : lyricsConfig.position === 'middle'
            ? height / 2 - boxHeight / 2
            : height - boxHeight - padding;

        ctx.save();
        ctx.fillStyle = hexToRgba(lyricsConfig.backgroundColor, lyricsConfig.backgroundOpacity);
        ctx.fillRect(padding, y, width - padding * 2, boxHeight);
        ctx.fillStyle = lyricsConfig.textColor || '#ffffff';
        ctx.font = '34px system-ui, sans-serif';
        ctx.textAlign = lyricsConfig.textAlign;
        const textX =
          lyricsConfig.textAlign === 'left'
            ? padding + 20
            : lyricsConfig.textAlign === 'right'
            ? width - padding - 20
            : width / 2;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, textX, y + boxHeight / 2, width - padding * 3);
        ctx.restore();
      }

      if (bibleVerseConfig.isVisible && (bibleVerseConfig.text || bibleVerseConfig.reference)) {
        const padding = 40;
        const boxHeight = 200;
        const y =
          bibleVerseConfig.position === 'top'
            ? padding
            : bibleVerseConfig.position === 'middle'
            ? height / 2 - boxHeight / 2
            : height - boxHeight - padding;

        ctx.save();
        ctx.fillStyle = hexToRgba(bibleVerseConfig.backgroundColor, bibleVerseConfig.backgroundOpacity);
        ctx.fillRect(padding, y, width - padding * 2, boxHeight);
        ctx.fillStyle = bibleVerseConfig.textColor || '#ffffff';
        ctx.font = '32px system-ui, sans-serif';
        ctx.textAlign = bibleVerseConfig.textAlign;
        const textX =
          bibleVerseConfig.textAlign === 'left'
            ? padding + 20
            : bibleVerseConfig.textAlign === 'right'
            ? width - padding - 20
            : width / 2;
        ctx.textBaseline = 'middle';
        const mainY = y + boxHeight / 2 - 20;
        ctx.fillText(bibleVerseConfig.text, textX, mainY, width - padding * 3);
        if (bibleVerseConfig.reference) {
          ctx.font = '26px system-ui, sans-serif';
          ctx.fillText(bibleVerseConfig.reference, textX, mainY + 40, width - padding * 3);
        }
        ctx.restore();
      }

      if (lowerThirdConfig.isVisible && (lowerThirdConfig.topText || lowerThirdConfig.mainText)) {
        const scale = lowerThirdConfig.scale ?? 1;
        const baseHeight = 180 * scale;
        const marginBottom = 80;
        const yTopBar = height - baseHeight - marginBottom;
        const topBarHeight = baseHeight * 0.4;
        const mainBarHeight = baseHeight * 0.6;

        ctx.save();

        const topGrad = ctx.createLinearGradient(0, yTopBar, width, yTopBar + topBarHeight);
        topGrad.addColorStop(0, lowerThirdConfig.accentColor || '#d32f2f');
        topGrad.addColorStop(1, darken(lowerThirdConfig.accentColor || '#d32f2f', 20));
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, yTopBar, width, topBarHeight);

        const mainGrad = ctx.createLinearGradient(0, yTopBar + topBarHeight, width, yTopBar + baseHeight);
        mainGrad.addColorStop(0, lowerThirdConfig.mainBarColor || '#ffffff');
        mainGrad.addColorStop(1, darken(lowerThirdConfig.mainBarColor || '#ffffff', 15));
        ctx.fillStyle = mainGrad;
        ctx.fillRect(0, yTopBar + topBarHeight, width, mainBarHeight);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        if (lowerThirdConfig.topText) {
          ctx.font = '40px system-ui, sans-serif';
          ctx.fillText(lowerThirdConfig.topText, 200, yTopBar + topBarHeight / 2, width - 240);
        }

        if (lowerThirdConfig.mainText) {
          ctx.font = '30px system-ui, sans-serif';
          ctx.fillText(lowerThirdConfig.mainText, 200, yTopBar + topBarHeight + mainBarHeight / 2, width - 240);
        }

        ctx.restore();
      }

      animationFrameRef.current = window.requestAnimationFrame(drawFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(drawFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [sourceStream, rotate90, zoomScale, lowerThirdConfig, announcementConfig, lyricsConfig, bibleVerseConfig]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      style={{ display: 'none' }}
    />
  );
};

export default ProgramOutputCanvas;
