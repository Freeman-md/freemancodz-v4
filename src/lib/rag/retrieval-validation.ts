export function assertQueryEmbeddingLength(queryEmbedding: number[]) {
  if (queryEmbedding.length !== 1536) {
    throw new Error(`matchSiteChunks expected a 1536-length embedding, received ${queryEmbedding.length}.`);
  }
}
