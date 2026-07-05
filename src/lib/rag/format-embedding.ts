export function formatEmbeddingForPgvector(values: number[]) {
  return `[${values.join(",")}]`;
}
