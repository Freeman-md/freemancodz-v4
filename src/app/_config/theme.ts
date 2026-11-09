export const THEME_STORAGE_KEY = "freemancodz-theme";

// Apply a saved preference before paint; dark remains the default without storage.
export const THEME_INIT_SCRIPT = `(function(){try{document.documentElement.dataset.theme=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light"?"light":"dark"}catch{}})()`;
