'use client';

import { forwardRef } from 'react';

interface Props {
  className?: string;
}

export const CameraView = forwardRef<HTMLVideoElement, Props>(({ className }, ref) => (
  <video
    ref={ref}
    autoPlay
    playsInline
    muted
    className={`w-full h-full object-cover scale-x-[-1] ${className ?? ''}`}
  />
));

CameraView.displayName = 'CameraView';
