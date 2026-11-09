export function followHomeAnchor(href: string) {
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
}
