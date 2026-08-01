export type PortfolioAsset =
  { kind: "missing" } | { kind: "stream"; stream: ReadableStream; contentType: string | null };
