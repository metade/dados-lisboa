// Utilitários leves (vanilla)
export const qs  = (sel, el=document) => el.querySelector(sel);
export const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

export const throttle = (fn, wait=100) => {
  let inFlight = false; let lastArgs;
  return (...args) => {
    lastArgs = args;
    if (inFlight) return;
    inFlight = true;
    setTimeout(() => { inFlight = false; fn(...lastArgs); }, wait);
  };
};

export const fmt = {
  number: (n, locales='pt-PT') => new Intl.NumberFormat(locales).format(n),
  meters: (m) => m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`
};
