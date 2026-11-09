export function followHomeAnchor(href: string, highlight = false) {
  const url = new URL(href, window.location.href);

  if (window.location.pathname !== url.pathname) {
    window.location.assign(url.href);

    return;
  }

  const destination = document.getElementById(url.hash.slice(1) || "top");

  if (window.location.href !== url.href) {
    window.history.pushState(null, "", url.href);
  }

  destination?.scrollIntoView();
  destination?.focus({ preventScroll: true });

  if (highlight) {
    highlightPortfolioAnchor(destination);
  }
}

const portfolioDestinations = new Set(["top", "experience", "services"]);

export function highlightPortfolioAnchor(destination: HTMLElement | null) {
  if (!destination || !portfolioDestinations.has(destination.id)) {
    return;
  }

  destination.focus({ preventScroll: true });

  const marker = String(performance.now());

  destination.dataset.portfolioHighlight = marker;
  window.setTimeout(() => {
    if (destination.dataset.portfolioHighlight === marker) {
      delete destination.dataset.portfolioHighlight;
    }
  }, 1600);
}
