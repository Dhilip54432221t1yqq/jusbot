import React from 'react';

/**
 * Sandy Loading - Blurred Overlay Version.
 * Features a semi-transparent, blurred background with the custom SVG animation.
 */
export default function LottieLoader({ fullPage = false }) {
  const containerClasses = fullPage 
    ? "fixed inset-0 z-[9999] bg-white/10 backdrop-blur-md flex flex-col items-center justify-center h-screen w-screen"
    : "absolute inset-0 z-[50] bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center min-h-full w-full";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div className="stage relative w-[250px] h-[250px]">
          <svg viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
              <clipPath id="clip-top-bulb">
                <circle cx="125" cy="95" r="34" />
              </clipPath>
              <clipPath id="clip-bottom-bulb">
                <circle cx="125" cy="160" r="34" />
              </clipPath>

              {/* Radial gradient for glass depth */}
              <radialGradient id="glass-grad-top" cx="35%" cy="35%" r="75%">
                <stop offset="0%"  stopColor="#5FE8CC" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#00D3B3" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#00A188" stopOpacity="0.8" />
              </radialGradient>
              <radialGradient id="glass-grad-bot" cx="35%" cy="35%" r="75%">
                <stop offset="0%"  stopColor="#5FE8CC" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#00D3B3" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#00A188" stopOpacity="0.8" />
              </radialGradient>

              {/* Sand gradient for the mound */}
              <linearGradient id="sand-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#FFB68A" />
                <stop offset="50%" stopColor="#FF8552" />
                <stop offset="100%" stopColor="#E8632A" />
              </linearGradient>
            </defs>

            {/* Background blob */}
            <g className="blob" opacity="0.55">
              <path d="M 45 95 C 25 65, 65 35, 105 50 C 135 30, 185 45, 200 80 C 235 90, 240 135, 205 150 C 215 180, 175 200, 145 185 C 105 205, 60 180, 65 145 C 35 135, 30 110, 45 95 Z"
                    fill="var(--blob)" />
            </g>

            {/* Ground shadow */}
            <ellipse className="ground-shadow" cx="125" cy="222" rx="55" ry="6" fill="var(--shadow)" />

            {/* ============= HOURGLASS ============= */}
            <g className="hourglass">

              {/* ===== Top cap ===== */}
              <g>
                <ellipse cx="125" cy="64" rx="42" ry="6" fill="rgba(0,0,0,0.18)" />
                <ellipse cx="125" cy="60" rx="42" ry="9" fill="var(--cap)" />
                <ellipse cx="125" cy="56.5" rx="40" ry="3" fill="var(--cap-shine)" opacity="0.45" />
                <ellipse cx="125" cy="60" rx="33" ry="4.2" fill="var(--glass-band)" />
                <ellipse cx="125" cy="58.5" rx="33" ry="2.6" fill="var(--glass-deep)" opacity="0.8" />
                <ellipse cx="115" cy="58" rx="6" ry="1.2" fill="#5FE8CC" opacity="0.9" />
                <path d="M 83 60 Q 125 76, 167 60 L 167 62 Q 125 78, 83 62 Z" fill="rgba(0,0,0,0.35)" />
              </g>

              {/* ===== Top bulb glass ===== */}
              <circle cx="125" cy="95" r="34" fill="url(#glass-grad-top)" />
              <circle cx="125" cy="95" r="34" fill="none" stroke="var(--glass-rim)" strokeWidth="1.2" opacity="0.4" />
              <ellipse className="glass-shine" cx="106" cy="80" rx="7" ry="11" fill="var(--highlight)" opacity="0.85" />
              <circle cx="100" cy="93" r="2" fill="var(--highlight-2)" opacity="0.9" />
              <path d="M 150 78 Q 156 95, 148 112" fill="none" stroke="var(--highlight-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />

              {/* ===== Top sand (drains) ===== */}
              <g clipPath="url(#clip-top-bulb)">
                <g className="sand-top">
                  <path d="M 88 72 Q 110 64, 125 70 Q 142 76, 162 70 L 162 130 L 88 130 Z" fill="var(--sand-deep)" />
                  <path d="M 88 76 Q 110 70, 125 74 Q 142 80, 162 74 L 162 84 Q 142 90, 125 84 Q 110 78, 88 86 Z" fill="var(--sand-mid)" opacity="0.85" />
                  <path d="M 88 72 Q 110 64, 125 70 Q 142 76, 162 70 L 162 78 Q 142 84, 125 78 Q 110 72, 88 80 Z" fill="var(--sand-light)" />
                  <ellipse cx="105" cy="100" rx="6" ry="1.2" fill="var(--sand-dark)" opacity="0.45" />
                  <ellipse cx="138" cy="108" rx="5" ry="1" fill="var(--sand-dark)" opacity="0.45" />
                </g>
              </g>

              {/* ===== Neck (pinch) ===== */}
              <path d="M 110 122 Q 125 132, 140 122 L 140 134 Q 125 124, 110 134 Z" fill="var(--glass)" opacity="0.78" />
              <path d="M 110 122 Q 125 132, 140 122" fill="none" stroke="var(--glass-rim)" strokeWidth="1" opacity="0.5" />
              <path d="M 110 134 Q 125 124, 140 134" fill="none" stroke="var(--glass-rim)" strokeWidth="1" opacity="0.5" />

              {/* ===== Falling sand stream ===== */}
              <g className="stream">
                <rect x="123" y="125" width="4" height="14" fill="var(--sand-deep)" />
                <rect x="123.5" y="125" width="1.2" height="14" fill="var(--sand-light)" opacity="0.7" />
                <circle cx="125" cy="140" r="2.4" fill="var(--sand-deep)" />
                <circle cx="125" cy="140" r="1.1" fill="var(--sand-light)" />
              </g>

              {/* ===== Bottom bulb glass ===== */}
              <circle cx="125" cy="160" r="34" fill="url(#glass-grad-bot)" />
              <circle cx="125" cy="160" r="34" fill="none" stroke="var(--glass-rim)" strokeWidth="1.2" opacity="0.4" />
              <ellipse className="glass-shine" cx="106" cy="146" rx="5" ry="8" fill="var(--highlight)" opacity="0.7" />
              <path d="M 152 144 Q 158 162, 148 180" fill="none" stroke="var(--highlight-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />

              {/* ===== Bottom sand mound (grows) ===== */}
              <g clipPath="url(#clip-bottom-bulb)">
                <g className="sand-bottom">
                  <path d="M 88 195 L 162 195 L 162 162 Q 152 152, 140 158 Q 130 152, 120 156 Q 110 150, 100 158 Q 92 156, 88 162 Z" fill="url(#sand-grad)" />
                  <path d="M 90 162 Q 100 158, 110 161 Q 120 156, 130 161 Q 142 158, 158 162 L 158 167 Q 142 163, 130 167 Q 120 162, 110 167 Q 100 164, 90 168 Z" fill="var(--sand-light)" />
                  <ellipse cx="108" cy="161" rx="3.5" ry="1.2" fill="var(--sand-dark)" opacity="0.35" />
                  <ellipse cx="140" cy="160" rx="3" ry="1" fill="var(--sand-dark)" opacity="0.35" />
                  <circle cx="115" cy="159" r="0.9" fill="var(--sand-dark)" opacity="0.6" />
                  <circle cx="135" cy="161" r="0.7" fill="var(--sand-dark)" opacity="0.6" />
                  <circle cx="100" cy="163" r="0.8" fill="var(--sand-dark)" opacity="0.6" />
                </g>
              </g>

              {/* ===== Floating grains ===== */}
              <g clipPath="url(#clip-top-bulb)">
                <circle className="grain g1" cx="108" cy="100" r="1.8" fill="var(--sand-deep)" />
                <circle className="grain g3" cx="140" cy="95"  r="1.5" fill="var(--sand-light)" />
                <circle className="grain g5" cx="118" cy="112" r="2"   fill="var(--sand-deep)" />
                <circle className="grain g7" cx="132" cy="105" r="1.2" fill="var(--sand-mid)" />
              </g>
              <g clipPath="url(#clip-bottom-bulb)">
                <circle className="grain g2" cx="105" cy="148" r="1.8" fill="var(--sand-deep)" />
                <circle className="grain g4" cx="142" cy="145" r="1.5" fill="var(--sand-light)" />
                <circle className="grain g6" cx="128" cy="152" r="2"   fill="var(--sand-deep)" />
                <circle className="grain g8" cx="115" cy="142" r="1.2" fill="var(--sand-mid)" />
              </g>

              {/* ===== Glass sparkles ===== */}
              <g clipPath="url(#clip-top-bulb)">
                <g className="sparkle s1" transform="translate(112 88)">
                  <path d="M 0 -3 L 0.7 -0.7 L 3 0 L 0.7 0.7 L 0 3 L -0.7 0.7 L -3 0 L -0.7 -0.7 Z" fill="var(--sparkle)" />
                </g>
                <g className="sparkle s3" transform="translate(140 102)">
                  <path d="M 0 -2 L 0.5 -0.5 L 2 0 L 0.5 0.5 L 0 2 L -0.5 0.5 L -2 0 L -0.5 -0.5 Z" fill="var(--sparkle)" />
                </g>
              </g>
              <g clipPath="url(#clip-bottom-bulb)">
                <g className="sparkle s2" transform="translate(110 152)">
                  <path d="M 0 -2 L 0.5 -0.5 L 2 0 L 0.5 0.5 L 0 2 L -0.5 0.5 L -2 0 L -0.5 -0.5 Z" fill="var(--sparkle)" />
                </g>
                <g className="sparkle s4" transform="translate(145 172)">
                  <path d="M 0 -2.5 L 0.6 -0.6 L 2.5 0 L 0.6 0.6 L 0 2.5 L -0.6 0.6 L -2.5 0 L -0.6 -0.6 Z" fill="var(--sparkle)" />
                </g>
              </g>

              {/* ===== X marker ===== */}
              <g className="x-mark" transform="translate(104 148)">
                <line x1="-4" y1="-4" x2="4" y2="4" stroke="var(--x-mark)" strokeWidth="2" strokeLinecap="round" />
                <line x1="4"  y1="-4" x2="-4" y2="4" stroke="var(--x-mark)" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* ===== O marker ===== */}
              <circle className="o-mark" cx="138" cy="128" r="3.8" fill="none" stroke="var(--o-mark)" strokeWidth="1.8" />

              {/* ===== Bottom cap ===== */}
              <g>
                <ellipse cx="125" cy="191" rx="42" ry="5" fill="rgba(0,0,0,0.15)" />
                <ellipse cx="125" cy="195" rx="42" ry="9" fill="var(--cap)" />
                <ellipse cx="125" cy="191.5" rx="40" ry="2.5" fill="var(--cap-shine)" opacity="0.45" />
                <ellipse cx="125" cy="195" rx="33" ry="4.2" fill="var(--glass-band)" />
                <ellipse cx="125" cy="196.5" rx="33" ry="2.6" fill="var(--glass-deep)" opacity="0.8" />
                <ellipse cx="115" cy="194.5" rx="6" ry="1.2" fill="#5FE8CC" opacity="0.9" />
                <path d="M 83 195 Q 125 211, 167 195 L 167 197 Q 125 213, 83 197 Z" fill="rgba(0,0,0,0.35)" />
              </g>

            </g>

            {/* Whoosh strokes */}
            <g fill="none" stroke="var(--whoosh)" strokeWidth="5" strokeLinecap="round">
              <path className="whoosh w1" d="M 195 90 Q 220 95, 230 105" />
              <path className="whoosh w2" d="M 200 115 Q 225 118, 235 128" />
              <path className="whoosh w3" d="M 200 150 Q 222 158, 230 172" />
              <path className="whoosh w4" d="M 185 178 Q 210 188, 220 200" />
            </g>

          </svg>
        </div>
      </div>

      <style>{`
        :root {
          --glass:        #00D3B3;
          --glass-deep:   #00A188;
          --glass-band:   #00B599;
          --glass-rim:    #007F6B;
          --highlight:    #B3EDE3;
          --highlight-2:  #E6FBF6;
          --cap:          #1D1D1B;
          --cap-shine:    #3A3A38;
          --sand-light:   #FFE4D3;
          --sand-mid:     #FFB68A;
          --sand-deep:    #FF8552;
          --sand-dark:    #E8632A;
          --o-mark:       #00FFD8;
          --x-mark:       #FFFFFF;
          --sparkle:      #FFFFFF;
          --shadow:       rgba(0,0,0,0.22);
          --whoosh:       #FFFFFF;
          --blob:         #B3EDE3;
        }

        .blob {
          transform-box: fill-box; transform-origin: center;
          animation: blob-breathe 2.4s ease-in-out infinite;
        }
        @keyframes blob-breathe {
          0%, 100% { transform: scale(0.97); }
          50%      { transform: scale(1.03); }
        }

        .hourglass {
          transform-box: fill-box;
          transform-origin: 125px 125px;
          animation: rock 2.4s ease-in-out infinite;
        }
        @keyframes rock {
          0%, 100% { transform: rotate(12deg); }
          50%      { transform: rotate(18deg); }
        }

        .glass-shine {
          transform-box: fill-box; transform-origin: center;
          animation: shine 2.4s ease-in-out infinite;
        }
        @keyframes shine {
          0%, 100% { opacity: 0.8; }
          50%      { opacity: 1; }
        }

        .sand-top {
          transform-box: fill-box; transform-origin: center top;
          animation: drain 2.4s linear infinite;
        }
        @keyframes drain {
          0%   { transform: scaleY(1);    }
          100% { transform: scaleY(0.15); }
        }

        .sand-bottom {
          transform-box: fill-box; transform-origin: center bottom;
          animation: pile 2.4s linear infinite;
        }
        @keyframes pile {
          0%   { transform: scaleY(0.15); }
          100% { transform: scaleY(1);    }
        }

        .stream { animation: stream-flow 0.32s linear infinite; }
        @keyframes stream-flow {
          0%   { transform: translateY(-4px); }
          100% { transform: translateY(6px);  }
        }

        .grain {
          transform-box: fill-box; transform-origin: center;
          animation: drift 2.4s ease-in-out infinite;
        }
        .grain.g2 { animation-delay: -0.3s; }
        .grain.g3 { animation-delay: -0.6s; }
        .grain.g4 { animation-delay: -0.9s; }
        .grain.g5 { animation-delay: -1.2s; }
        .grain.g6 { animation-delay: -1.5s; }
        .grain.g7 { animation-delay: -1.8s; }
        .grain.g8 { animation-delay: -2.1s; }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(2px, -3px); }
          50%      { transform: translate(-2px, 2px); }
          75%      { transform: translate(3px, 1px); }
        }

        .x-mark {
          transform-box: fill-box; transform-origin: center;
          animation: x-float 2.4s ease-in-out infinite;
        }
        @keyframes x-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(-2px, -3px) rotate(8deg); }
        }
        .o-mark {
          transform-box: fill-box; transform-origin: center;
          animation: o-float 2.4s ease-in-out infinite;
        }
        @keyframes o-float {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(3px, 2px); }
        }

        .sparkle {
          transform-box: fill-box; transform-origin: center;
          animation: twinkle 1.6s ease-in-out infinite;
        }
        .sparkle.s2 { animation-delay: -0.4s; }
        .sparkle.s3 { animation-delay: -0.8s; }
        .sparkle.s4 { animation-delay: -1.2s; }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50%      { opacity: 1; transform: scale(1);   }
        }

        .whoosh { opacity: 0; animation: whoosh-pulse 1.2s ease-in-out infinite; }
        .whoosh.w1 { animation-delay: 0s; }
        .whoosh.w2 { animation-delay: 0.08s; }
        .whoosh.w3 { animation-delay: 0.16s; }
        .whoosh.w4 { animation-delay: 0.24s; }
        @keyframes whoosh-pulse {
          0%, 100% { opacity: 0; transform: translateX(0); }
          50%      { opacity: 1; transform: translateX(4px); }
        }

        .ground-shadow {
          transform-box: fill-box; transform-origin: center;
          animation: shadow-pulse 2.4s ease-in-out infinite;
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: scaleX(1);   opacity: 0.22; }
          50%      { transform: scaleX(0.9); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
