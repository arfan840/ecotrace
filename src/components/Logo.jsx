import React from 'react';

/**
 * Reusable vector logo for EcoTrace.
 * 
 * @param {number} [height=40] - The display height of the logo in pixels.
 * @param {boolean} [showText=true] - Toggle display of 'EcoTrace' text.
 * @param {string} [className=""] - Optional CSS class name.
 */
export default function Logo({ height = 40, showText = true, className = "" }) {
  const width = showText ? 240 : 60;
  return (
    <svg 
      width={width * (height / 60)} 
      height={height} 
      viewBox={`0 0 ${width} 60`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Outer soft-green leaf silhouette */}
      <path 
        d="M30 8C42 8 50 18 50 32C50 44 42 52 30 52C18 52 10 44 10 32C10 18 18 8 30 8Z" 
        fill="url(#logoGrad)" 
        fillOpacity="0.12" 
      />

      {/* Interlocking circular eco/tracking loops */}
      <path 
        d="M30 12C38 12 44 18 44 28C44 38 34 48 30 48" 
        stroke="#10B981" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />
      <path 
        d="M30 48C22 48 16 42 16 32C16 22 26 12 30 12" 
        stroke="#06B6D4" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Central barcode lines */}
      <rect x="25" y="24" width="2" height="12" fill="currentColor" opacity="0.6" />
      <rect x="29" y="24" width="3.5" height="12" fill="currentColor" opacity="0.6" />
      <rect x="35" y="24" width="1.5" height="12" fill="currentColor" opacity="0.6" />

      {/* Scanning red line */}
      <line x1="20" y1="30" x2="40" y2="30" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      
      {showText && (
        <>
          {/* Main cursive branding */}
          <text 
            x="85" 
            y="35" 
            fontFamily="'Playfair Display', Georgia, serif" 
            fontSize="26" 
            fontWeight="bold" 
            fontStyle="italic" 
            fill="currentColor"
          >
            EcoTrace
          </text>
          {/* Subheading branding */}
          <text 
            x="85" 
            y="50" 
            fontFamily="'Inter', sans-serif" 
            fontSize="10" 
            fontWeight="800" 
            letterSpacing="3" 
            fill="var(--text-muted, #94a3b8)"
          >
            TRACK
          </text>
        </>
      )}
    </svg>
  );
}
