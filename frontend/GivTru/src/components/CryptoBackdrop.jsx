// Blurred crypto + charity backdrop.
// The parent element must be position: relative; overflow: hidden.

const css = `
.gt-backdrop {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(1100px 560px at 85% 15%, rgba(34, 197, 94, 0.10), transparent 60%),
        radial-gradient(900px 500px at 10% 100%, rgba(99, 102, 241, 0.08), transparent 60%),
        #ffffff;
}
.gt-backdrop-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
/* white wash on the left keeps the hero text readable */
.gt-backdrop::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.90) 0%,
        rgba(255, 255, 255, 0.60) 42%,
        rgba(255, 255, 255, 0) 75%
    );
}
@keyframes gt-float {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-14px); }
}
.gt-float { animation: gt-float 9s ease-in-out infinite; transform-box: fill-box; }
@media (prefers-reduced-motion: reduce) { .gt-float { animation: none; } }
`;

// Small building blocks, drawn around (0,0) so they can be placed with translate/scale
const Eth = ({ top, bottom }) => (
    <g>
        <polygon points="0,-70 40,0 0,22 -40,0" fill={top} />
        <polygon points="0,34 40,8 0,70 -40,8" fill={bottom} />
    </g>
);

const Coin = ({ fill, ring }) => (
    <g>
        <circle r="44" fill={fill} />
        <circle r="32" fill="none" stroke={ring} strokeWidth="5" />
        <polygon points="0,-14 10,0 0,14 -10,0" fill={ring} />
    </g>
);

const Hex = ({ stroke }) => (
    <polygon
        points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25"
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinejoin="round"
    />
);

const Heart = ({ fill }) => (
    <path
        d="M0,28 C-50,-6 -46,-46 -22,-46 C-10,-46 0,-38 0,-30 C0,-38 10,-46 22,-46 C46,-46 50,-6 0,28 Z"
        fill={fill}
    />
);

const Blocks = ({ fill }) => (
    <g fill={fill}>
        <rect x="-70" y="-14" width="28" height="28" rx="5" />
        <rect x="-14" y="-14" width="28" height="28" rx="5" />
        <rect x="42" y="-14" width="28" height="28" rx="5" />
        <rect x="-42" y="-3" width="28" height="6" />
        <rect x="14" y="-3" width="28" height="6" />
    </g>
);

// place a shape: position, scale, float delay
const Spot = ({ x, y, s = 1, delay = 0, children }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
        <g className="gt-float" style={{ animationDelay: `${delay}s` }}>
            {children}
        </g>
    </g>
);

export default function CryptoBackdrop() {
    return (
        <div className="gt-backdrop" aria-hidden="true">
            <style>{css}</style>
            <svg
                className="gt-backdrop-svg"
                viewBox="0 0 1440 900"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="gtBlurHeavy" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="9" />
                    </filter>
                    <filter id="gtBlurSoft" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4.5" />
                    </filter>
                </defs>

                {/* large, heavily blurred, right side */}
                <g filter="url(#gtBlurHeavy)" opacity="0.55">
                    <Spot x={1130} y={290} s={2.6} delay={-2}>
                        <Eth top="#818cf8" bottom="#6366f1" />
                    </Spot>
                    <Spot x={1310} y={560} s={2} delay={-5}>
                        <Coin fill="#4ade80" ring="#16a34a" />
                    </Spot>
                    <Spot x={960} y={640} s={3} delay={-3}>
                        <Heart fill="#fb7185" />
                    </Spot>
                </g>

                {/* smaller, lightly blurred accents */}
                <g filter="url(#gtBlurSoft)" opacity="0.5">
                    <Spot x={800} y={130} s={0.9} delay={-1}>
                        <Coin fill="#fbbf24" ring="#d97706" />
                    </Spot>
                    <Spot x={1380} y={130} s={1.1} delay={-4}>
                        <Hex stroke="#22c55e" />
                    </Spot>
                    <Spot x={1230} y={810} s={1.1} delay={-6}>
                        <Eth top="#94a3b8" bottom="#64748b" />
                    </Spot>
                    <Spot x={620} y={800} s={0.8} delay={-2}>
                        <Coin fill="#4ade80" ring="#16a34a" />
                    </Spot>
                    <Spot x={1000} y={450} s={0.75} delay={-3}>
                        <Coin fill="#fbbf24" ring="#d97706" />
                    </Spot>
                    <Spot x={760} y={470} s={1} delay={-5}>
                        <Blocks fill="#a5b4fc" />
                    </Spot>
                    <Spot x={1160} y={110} s={0.7} delay={-7}>
                        <Heart fill="#4ade80" />
                    </Spot>
                    {/* donation path: coin dropping toward the heart */}
                    <path
                        d="M1000 480 C 990 530, 975 565, 962 600"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="2 12"
                    />
                </g>
            </svg>
        </div>
    );
}