import { ASSISTANT_ERRORS, AssistantError } from "../../errors";
import type { PortfolioSearchService } from "../../../portfolio/services/portfolio-search.service";
import { searchPortfolioArgumentsSchema } from "./schema";

export async function searchPortfolio(
  rawArguments: string,
  search: Pick<PortfolioSearchService, "search">,
  signal: AbortSignal,
) {
  const { query } = searchPortfolioArgumentsSchema.parse(JSON.parse(rawArguments));

  const results = await search.search(query, signal).catch((cause: unknown) => {
    signal.throwIfAborted();

    throw new AssistantError(ASSISTANT_ERRORS.PORTFOLIO_SEARCH_FAILED, { cause });
  });

  signal.throwIfAborted();

  return {
    matches: results.map(({ excerpt }) => excerpt),
    sources: [...new Map(results.map(({ source }) => [source.url, source])).values()],
  };
}
