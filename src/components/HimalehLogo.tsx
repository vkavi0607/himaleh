import React from 'react';

export type HimalehLogoVariant = 'full' | 'crest' | 'horizontal' | 'wordmark' | 'badge';
export type HimalehLogoTheme = 'auto' | 'light' | 'dark' | 'gold';
export type HimalehLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

interface HimalehLogoProps {
  variant?: HimalehLogoVariant;
  theme?: HimalehLogoTheme;
  size?: HimalehLogoSize | number;
  className?: string;
  animated?: boolean;
  showTagline?: boolean;
  onClick?: () => void;
}

const sizeMap: Record<HimalehLogoSize, { crest: number; fullWidth: number }> = {
  xs: { crest: 24, fullWidth: 70 },
  sm: { crest: 32, fullWidth: 100 },
  md: { crest: 44, fullWidth: 140 },
  lg: { crest: 60, fullWidth: 190 },
  xl: { crest: 84, fullWidth: 260 },
  '2xl': { crest: 120, fullWidth: 340 },
  hero: { crest: 180, fullWidth: 460 },
};

export const HimalehLogo: React.FC<HimalehLogoProps> = ({
  variant = 'crest',
  theme = 'auto',
  size = 'md',
  className = '',
  animated = false,
  showTagline = true,
  onClick,
}) => {
  // Resolve size
  const pixelSize = typeof size === 'number' ? size : sizeMap[size].crest;
  const fullWidth = typeof size === 'number' ? size * 2.2 : sizeMap[size].fullWidth;

  // Text color based on theme
  const getTextColorClass = () => {
    switch (theme) {
      case 'light':
        return 'text-slate-900 fill-[#0F172A]';
      case 'dark':
        return 'text-slate-50 fill-[#F8FAFC]';
      case 'gold':
        return 'text-amber-500 fill-[#D97706]';
      case 'auto':
      default:
        return 'text-slate-900 dark:text-slate-50 fill-[#0F172A] dark:fill-[#F8FAFC]';
    }
  };

  const getSubtextColorClass = () => {
    switch (theme) {
      case 'light':
        return 'text-slate-500 fill-[#64748B]';
      case 'dark':
        return 'text-slate-400 fill-[#94A3B8]';
      case 'gold':
        return 'text-amber-400 fill-[#F59E0B]';
      case 'auto':
      default:
        return 'text-slate-500 dark:text-slate-400 fill-[#64748B] dark:fill-[#94A3B8]';
    }
  };

  // Mountain Crest SVG graphic
  const renderCrest = (crestWidth: number, crestHeight: number) => (
    <svg
      viewBox="0 0 512 512"
      width={crestWidth}
      height={crestHeight}
      className={`shrink-0 select-none ${animated ? 'transition-all duration-300' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Golden Trail Gradient */}
        <linearGradient id={`trailGrad-${crestWidth}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="25%" stopColor="#B45309" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="85%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        <linearGradient id={`trailHighlight-${crestWidth}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0.2" />
        </linearGradient>

        {/* Crimson Summit Flag Gradient */}
        <linearGradient id={`flagGrad-${crestWidth}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="60%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>

        {/* Dark Mountain Slate Gradients */}
        <linearGradient id={`slateGrad-${crestWidth}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#080D1A" />
        </linearGradient>

        {/* Snow Facet Gradient */}
        <linearGradient id={`snowGrad-${crestWidth}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Mountain Crest Silhouette */}
      <g transform="translate(0, 10)">
        {/* Base Mountain Polygon */}
        <polygon
          points="256,120 70,400 195,402 256,396 325,402 442,400"
          fill={`url(#slateGrad-${crestWidth})`}
        />

        {/* Left Obsidian Shadow Facet */}
        <polygon
          points="256,120 170,245 70,400 150,365 200,342"
          fill="#0B1120"
          opacity="0.94"
        />
        <polygon points="70,400 120,335 152,365" fill="#1E293B" />

        {/* Right Mountain Slope (Snow Facet) */}
        <polygon
          points="256,120 282,185 315,220 365,295 442,400 315,402 256,396"
          fill={`url(#snowGrad-${crestWidth})`}
        />

        {/* Left Ridge Secondary Snow Accents */}
        <polygon points="170,245 200,285 150,365 135,328" fill="#FFFFFF" opacity="0.95" />
        <polygon points="120,335 142,358 100,378" fill="#F8FAFC" opacity="0.9" />

        {/* Mid Mountain Snow Ridges */}
        <polygon points="256,120 278,185 248,212 242,165" fill="#FFFFFF" />
        <polygon points="292,192 342,268 312,292 280,228" fill="#E2E8F0" />
        <polygon points="350,285 408,360 372,375 330,320" fill="#F1F5F9" />

        {/* Sharp Right Ridge Rock Outcroppings */}
        <polygon points="342,268 372,320 312,292" fill="#1E293B" opacity="0.85" />
        <polygon points="408,360 442,400 380,388" fill="#0F172A" />

        {/* THE SIGNATURE GOLDEN SUMMIT TRAIL */}
        <path
          d="M 198,402 
             C 245,400 288,388 318,366
             C 345,346 328,308 278,284
             C 220,256 215,220 244,180
             C 264,150 259,130 256,120
             L 253,120
             C 250,142 242,168 222,200
             C 192,240 200,280 250,308
             C 292,332 292,360 254,384
             C 226,400 208,402 198,402 Z"
          fill={`url(#trailGrad-${crestWidth})`}
          className={animated ? 'animate-pulse' : ''}
        />

        {/* Golden Trail Highlight Curve */}
        <path
          d="M 215,398 
             C 255,392 292,380 314,362
             C 332,344 314,312 276,288
             C 226,260 222,224 248,182
             C 262,158 260,132 255,120
             L 256,120
             C 260,148 264,174 248,200
             C 224,238 228,275 278,302
             C 320,328 335,360 316,382
             C 294,400 258,402 215,398 Z"
          fill={`url(#trailHighlight-${crestWidth})`}
        />

        {/* Mountain Base Ground Contour */}
        <path d="M 70,400 Q 256,412 442,400 Q 256,398 70,400 Z" fill="#0F172A" />

        {/* SUMMIT FLAGPOST & CRIMSON FLAG */}
        <line
          x1="256"
          y1="124"
          x2="256"
          y2="64"
          stroke="#0F172A"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="256" cy="62" r="5.5" fill="#0F172A" />

        {/* Red Summit Flag waving rightward */}
        <path
          d="M 256,68 
             C 282,62 306,74 338,67
             C 332,86 337,98 339,104
             C 314,98 286,109 256,102 Z"
          fill={`url(#flagGrad-${crestWidth})`}
          className={animated ? 'origin-left hover:scale-105 transition-transform' : ''}
        />

        {/* Flag Shadow Fold */}
        <path
          d="M 292,67 C 310,70 322,69 338,67 L 339,104 C 322,101 310,103 292,101 Z"
          fill="#B91C1C"
          opacity="0.38"
        />
      </g>
    </svg>
  );

  // Variant: Just Mountain Crest
  if (variant === 'crest') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onClick={onClick}
      >
        {renderCrest(pixelSize, pixelSize)}
      </div>
    );
  }

  // Variant: Shield / Badge (Container with shadow & border)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-white/90 dark:bg-slate-900/90 shadow-sm p-1.5 shrink-0 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onClick={onClick}
      >
        {renderCrest(pixelSize - 12, pixelSize - 12)}
      </div>
    );
  }

  // Variant: Wordmark only
  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col select-none ${className}`} onClick={onClick}>
        <span
          className={`font-serif tracking-tight font-extrabold ${getTextColorClass()}`}
          style={{
            fontSize: pixelSize * 0.75,
            fontFamily: '"Plus Jakarta Sans", "Cinzel", Georgia, serif',
            letterSpacing: '-0.03em',
          }}
        >
          Himaleh
        </span>
        {showTagline && (
          <span
            className={`font-sans tracking-[0.25em] uppercase font-bold text-[9px] ${getSubtextColorClass()}`}
          >
            Track • Improve • Achieve
          </span>
        )}
      </div>
    );
  }

  // Variant: Horizontal lockup (Crest on left, Wordmark & Tagline on right)
  if (variant === 'horizontal') {
    return (
      <div
        className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        {renderCrest(pixelSize, pixelSize)}
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`font-serif tracking-tight font-extrabold ${getTextColorClass()}`}
            style={{
              fontSize: pixelSize * 0.52,
              fontFamily: '"Plus Jakarta Sans", "Cinzel", Georgia, serif',
              letterSpacing: '-0.025em',
            }}
          >
            Himaleh
          </span>
          {showTagline && (
            <span
              className={`font-sans tracking-[0.22em] uppercase font-bold text-[9px] mt-0.5 ${getSubtextColorClass()}`}
            >
              Track • Improve • Achieve
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default Variant: 'full' (Stacked mountain crest + wordmark + tagline)
  return (
    <div
      className={`inline-flex flex-col items-center justify-center text-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ maxWidth: fullWidth }}
      onClick={onClick}
    >
      {renderCrest(pixelSize, pixelSize)}
      <div className="mt-1 flex flex-col items-center">
        <span
          className={`font-serif tracking-tight font-black leading-tight ${getTextColorClass()}`}
          style={{
            fontSize: pixelSize * 0.42,
            fontFamily: '"Plus Jakarta Sans", "Cinzel", Georgia, serif',
            letterSpacing: '-0.03em',
          }}
        >
          Himaleh
        </span>
        {showTagline && (
          <span
            className={`font-sans tracking-[0.28em] uppercase font-bold text-[10px] mt-1 ${getSubtextColorClass()}`}
          >
            Track • Improve • Achieve
          </span>
        )}
      </div>
    </div>
  );
};
