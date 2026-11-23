import React from 'react';

const TINTA = '#1E2233';

function Simbolo() {
  return (
    <>
      <g fill="#C8F032">
        <circle cx="256" cy="148" r="20" />
        <rect x="241" y="186" width="30" height="204" rx="6" />
      </g>
      <g fill="none" stroke={TINTA} strokeWidth="26" strokeLinecap="round">
        <ellipse cx="250" cy="160" rx="88" ry="83" />
        <path d="M262 77 C305 73 347 70 390 70" strokeLinecap="butt" />
        <path d="M212 235 C160 252 128 290 134 330 C140 375 185 400 222 385 C245 375 260 335 300 310 C345 285 390 315 388 360 C386 410 340 437 295 436 C255 435 222 418 200 392" />
      </g>
    </>
  );
}

/** Só o símbolo do GiG, em vetor. A altura vem de `className` (ex.: `h-8 w-auto`). */
export function LogoMark({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="112 48 300 412" className={className} role="img" aria-label="GiG">
      <Simbolo />
    </svg>
  );
}

/**
 * Marca completa (símbolo + "Greed is Great"), em vetor: fica nítida em qualquer
 * tamanho e densidade de tela. A altura vem de `className` (ex.: `h-10 w-auto`).
 */
export function Logo({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="112 48 2060 412" className={className} role="img" aria-label="Greed is Great">
      <Simbolo />
      <text
        x="470"
        y="340"
        fill={TINTA}
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight="700"
        fontSize="250"
        letterSpacing="-4"
        textLength="1688"
        lengthAdjust="spacingAndGlyphs"
      >
        Greed is Great
      </text>
    </svg>
  );
}
