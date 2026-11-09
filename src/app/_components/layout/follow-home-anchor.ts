export function followHomeAnchor(href: string) {
  const url = new URL(href, window.location.href);

  const destination = document.getElementById(url.hash.slice(1) || "top");

  if (window.location.href !== url.href) {
    window.history.pushState(null, "", url.href);
  }

  destination?.scrollIntoView();
  destination?.focus({ preventScroll: true });
}
