/* =========================================================
   LA VIE STUDIO — Ícones e ilustrações em SVG (traço dourado)
   Usam "currentColor", então herdam a cor definida no CSS.
   ========================================================= */

const ICONES = {
  /* ---------- Ilustrações dos procedimentos ---------- */
  tesoura:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="18" cy="47" r="7"/><circle cx="46" cy="47" r="7"/>' +
    '<path d="M23 42 45 10"/><path d="M41 42 19 10"/><circle cx="32" cy="27" r="1.4" fill="currentColor"/></svg>',

  coloracao:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M10 36h34c0 9-7.6 16-17 16S10 45 10 36z"/><path d="M14 36c3-3 8-3 11 0s8 3 11 0 6-2 8 0"/>' +
    '<path d="M38 30 54 8"/><path d="M50 6l7 5-3 4-7-5z"/><path d="M48 46c1.8 2.6 2.7 4.4 2.7 5.6a2.7 2.7 0 0 1-5.4 0c0-1.2.9-3 2.7-5.6z"/></svg>',

  mechas:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 6c-6 10 4 16-1 26s3 16 1 26"/><path d="M30 6c-6 10 4 16-1 26s3 16 1 26"/>' +
    '<path d="M40 6c-6 10 4 16-1 26s3 16 1 26"/><path d="M50 10l1.5 3.5L55 15l-3.5 1.5L50 20l-1.5-3.5L45 15l3.5-1.5z"/></svg>',

  hidratacao:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M32 6C24 18 15 27 15 39a17 17 0 0 0 34 0C49 27 40 18 32 6z"/>' +
    '<path d="M24 40a8 8 0 0 0 8 8"/><path d="M40 22c4-4 10-4 12-3-1 5-5 9-11 9"/></svg>',

  unhas:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="26" y="6" width="12" height="16" rx="2"/><path d="M24 22h16"/>' +
    '<path d="M19 28a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v24a6 6 0 0 1-6 6H25a6 6 0 0 1-6-6z"/><path d="M19 38h26"/></svg>',

  sobrancelha:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M10 24c10-9 30-11 44-3"/><path d="M10 40c10-11 34-11 44 0-10 11-34 11-44 0z"/>' +
    '<circle cx="32" cy="40" r="6"/><circle cx="34" cy="38" r="1.2" fill="currentColor"/></svg>',

  cilios:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8 28c12 14 36 14 48 0"/><path d="M14 34l-5 7"/><path d="M22 38l-3 8"/><path d="M32 40v9"/>' +
    '<path d="M42 38l3 8"/><path d="M50 34l5 7"/><path d="M28 14c2 2 6 2 8 0"/></svg>',

  maquiagem:
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="16" y="36" width="16" height="22" rx="2"/><rect x="18" y="26" width="12" height="10"/>' +
    '<path d="M19 26V14l10-6v18"/><path d="M44 58V30"/><path d="M40 30h8l-1-8c-.6-5-5.4-5-6 0z"/></svg>',

  /* ---------- Ícones de interface ---------- */
  coracao:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  diamante:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 16 3-16"/></svg>',
  flor:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="10" r="2.5"/><path d="M12 7.5C12 4 9.5 3 9.5 3S7 5 9.6 8.6M14.4 8.6C17 5 14.5 3 14.5 3S12 4 12 7.5M9.6 11.4C6 13 6.5 15.5 6.5 15.5s3 .5 4.4-3M13.1 12.5c1.4 3.5 4.4 3 4.4 3s.5-2.5-3.1-4.1M12 12.5V21M12 18c-2-2-4-2-5-1"/></svg>',
  estrela:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.3 5.6 6 .5-4.6 3.9 1.4 5.9L12 15.8 6.9 18.9l1.4-5.9L3.7 9.1l6-.5z"/></svg>',
  relogio:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  calendario:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  usuario:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  olho:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  seta:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  sair:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M8.8 8.2c0 3.9 3.1 7 7 7l1.1-1.5-1.9-1.1-1.1.8c-1.1-.4-2.5-1.8-2.9-2.9l.8-1.1-1.1-1.9z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor"/></svg>',
  telefone:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>'
};
