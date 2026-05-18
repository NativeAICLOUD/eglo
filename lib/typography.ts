export const typography = {
  display: 'text-5xl font-semibold tracking-[-0.02em] text-slate-900 leading-tight',
  h1:      'text-4xl font-semibold tracking-[-0.02em] text-slate-900 leading-tight',
  h2:      'text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-snug',
  h3:      'text-2xl font-medium  tracking-[-0.02em] text-slate-900',
  h4:      'text-xl  font-medium  tracking-[-0.02em] text-slate-900',
  body:    'text-base font-normal leading-relaxed tracking-[-0.01em] text-[#1a2332]',
  bodySm:  'text-sm  font-normal leading-relaxed tracking-[-0.01em] text-[#1a2332]',
  caption: 'text-xs  font-normal text-slate-500',
  nav:     'text-[15px] font-medium tracking-[-0.01em] text-gray-500',
  utility: 'text-[13px] font-normal text-slate-600',
} as const;

export type TypographyKey = keyof typeof typography;
