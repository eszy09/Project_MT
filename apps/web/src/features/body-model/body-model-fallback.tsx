export function BodyModelFallback({
  reason,
  failed = false,
  selectedLabel = "Selected area",
}: {
  reason: string;
  failed?: boolean;
  selectedLabel?: string;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-center">
      <svg
        viewBox="0 0 220 340"
        className="h-72 w-48"
        role="img"
        aria-label="Static human silhouette for the approximate progress avatar"
      >
        <defs>
          <linearGradient id="staticAvatarBody" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="52%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#bef264" />
          </linearGradient>
        </defs>
        <ellipse
          cx="110"
          cy="176"
          rx="84"
          ry="145"
          fill="#a78bfa"
          opacity="0.12"
        />
        <circle cx="110" cy="39" r="25" fill="#f8fafc" opacity="0.95" />
        <path
          d="M82 72 C96 63 124 63 138 72 C153 91 158 121 153 153 C149 182 142 204 146 235 L154 315 C155 326 145 333 136 326 L115 239 C113 231 107 231 105 239 L84 326 C75 333 65 326 66 315 L74 235 C78 204 71 182 67 153 C62 121 67 91 82 72 Z"
          fill="url(#staticAvatarBody)"
          opacity="0.92"
        />
        <path
          d="M68 88 C48 111 38 145 35 191 C34 204 44 210 52 201 C56 164 63 135 77 111 Z"
          fill="#d8b4fe"
          opacity="0.82"
        />
        <path
          d="M152 88 C172 111 182 145 185 191 C186 204 176 210 168 201 C164 164 157 135 143 111 Z"
          fill="#d8b4fe"
          opacity="0.82"
        />
        <path
          d="M83 132 C99 141 121 141 137 132"
          fill="none"
          stroke="#bef264"
          strokeLinecap="round"
          strokeOpacity="0.75"
          strokeWidth="4"
        />
        <path
          d="M83 180 C100 189 120 189 137 180"
          fill="none"
          stroke="#a78bfa"
          strokeLinecap="round"
          strokeOpacity="0.85"
          strokeWidth="4"
        />
      </svg>
      <p className="mt-4 font-black">
        {failed ? "Interactive avatar unavailable" : "Static avatar view"}
      </p>
      <p className="mt-2 text-sm font-bold text-lime-200">{selectedLabel}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{reason}</p>
    </div>
  );
}
