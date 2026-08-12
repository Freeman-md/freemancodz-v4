const MAX_CACHE_TAGS_PER_CALL = 128;

export function registerPortfolioCacheTags(
  tags: string[],
  register: (...tags: string[]) => void,
) {
  const uniqueTags = [...new Set(tags)];

  for (let index = 0; index < uniqueTags.length; index += MAX_CACHE_TAGS_PER_CALL) {
    register(...uniqueTags.slice(index, index + MAX_CACHE_TAGS_PER_CALL));
  }
}
