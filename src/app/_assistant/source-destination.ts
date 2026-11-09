const portfolioAnchors = new Set(["/#experience", "/#services", "/#top"]);

export function assistantSourceDestination(url: string) {
  return portfolioAnchors.has(url) || /^\/work\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url) ? url : null;
}
