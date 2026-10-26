// Small hand-drawn style SVG icons for the HUD (no emoji).

export function StationIcon({ i }: { i: number }) {
  if (i === 0)
    // noren curtain = dining room
    return (
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
        <rect x="4" y="5" width="24" height="3" rx="1.5" fill="#6e4b32" />
        <path d="M6 8h6v12c-2 1-4 1-6 0z" fill="#56638c" />
        <path d="M13 8h6v12c-2 1-4 1-6 0z" fill="#56638c" />
        <path d="M20 8h6v12c-2 1-4 1-6 0z" fill="#56638c" />
        <path
          d="M8 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
          stroke="#fff6e9"
          strokeWidth="1.6"
          fill="none"
        />
        <rect x="5" y="22" width="22" height="4" rx="2" fill="#d9b48a" />
      </svg>
    );
  if (i === 1)
    // nigiri on a geta
    return (
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
        <rect x="3" y="20" width="26" height="5" rx="2" fill="#d9b48a" />
        <rect x="6" y="25" width="3" height="3" fill="#a87a50" />
        <rect x="23" y="25" width="3" height="3" fill="#a87a50" />
        <ellipse cx="16" cy="17" rx="8" ry="4" fill="#fbf6ec" stroke="#d9c9ad" />
        <path d="M7 14c3-4 15-4 18 0 1 2-1 3-2 3H9c-1 0-3-1-2-3z" fill="#f28a55" />
        <path d="M11 12l2 4M16 11.5l1.5 4.5M21 12l1 4" stroke="#ffe1cc" strokeWidth="1.4" />
      </svg>
    );
  // knife and fryer
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
      <path d="M5 22L22 5l3 1-15 18z" fill="#dfe6ea" stroke="#8a96a0" strokeWidth="0.8" />
      <rect x="2" y="22" width="9" height="4" rx="2" transform="rotate(-45 6 24)" fill="#6e4b32" />
      <path d="M16 24h13v3c0 2-2 3-3 3h-7c-1 0-3-1-3-3z" fill="#5b6168" />
      <ellipse cx="22.5" cy="24" rx="6.5" ry="1.6" fill="#e9b45c" />
    </svg>
  );
}

export function PointerHand() {
  return (
    <svg viewBox="0 0 48 56" width="44" height="52" aria-hidden>
      <path
        d="M18 4c2.6 0 4.5 2 4.5 4.6V24l2-.6c2.2-.6 4.4.8 4.9 3l.2.8 1.6-.4c2.3-.5 4.5 1 5 3.2l.2.9c2.4-.5 4.7 1 5.1 3.4l1.1 6.6c.9 5.6-2.2 11.1-7.5 13.1l-2.6 1c-5.3 2-11.3.3-14.7-4.2L7.2 37.4c-1.5-2-1.1-4.8.9-6.3 1.8-1.3 4.2-1.2 5.8.2l-.4-22.6C13.5 6 15.5 4 18 4z"
        fill="#fff6e9"
        stroke="#4a3326"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Star({ on, size = 22 }: { on: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z"
        fill={on ? '#e9b45c' : '#e8dccb'}
        stroke={on ? '#b9822e' : '#cdbda6'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Lock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="#b9a58a" />
      <path d="M8 10V8a4 4 0 018 0v2" stroke="#b9a58a" strokeWidth="2.2" fill="none" />
    </svg>
  );
}
