# RAG

The indexer builds search documents from published profile, work, experience, and services. OpenAI’s `text-embedding-3-small` model produces embeddings for the excerpts. PostgreSQL stores the vectors with the source keys, titles, and excerpts.

At request time, the search tool embeds a standalone visitor query. PostgreSQL uses pgvector cosine distance and a distance cutoff to return the closest excerpts. The assistant uses those excerpts to answer and renders links to their public sources. An empty retrieval produces a message that the portfolio could not support an answer.

## Refresh the index

1. Apply the migrations for the intended database and follow the [content publishing procedure](portfolio-content-system.md) to seed, deploy, and verify the public pages.
2. Run `npm run portfolio:index` locally or `npm run portfolio:index -- --production --apply` for production. The production command without `--apply` previews document keys. The indexer checks the database target. A failed refresh leaves the previous index intact.
3. Ask the assistant about the change and open the corresponding source link.

Use disposable PostgreSQL for indexing rehearsals when hosted Preview shares the production database.
