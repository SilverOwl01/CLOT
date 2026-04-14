// src/components/PillIcons.jsx
import React from 'react';

export const IconHalfCircle = () => (
  <div className="w-8 h-8 rounded-full border border-[#2a788e] shadow-sm bg-slate-100 relative overflow-hidden">
    <div className="absolute inset-0 bg-[#2a788e]" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)', transform: 'scale(1.1)' }}></div>
  </div>
);

export const IconFullCircle = () => (
  <div className="w-8 h-8 rounded-full bg-[#2a788e] border border-[#1f5c6d] shadow-sm"></div>
);

export const IconQuarterCircle = () => (
  <div className="w-8 h-8 rounded-full border border-[#2a788e] shadow-sm bg-slate-100 relative overflow-hidden">
    <div className="absolute inset-0 bg-[#2a788e]" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)', transform: 'scale(1.1)' }}></div>
  </div>
);