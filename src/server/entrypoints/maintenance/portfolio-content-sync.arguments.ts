import type { PortfolioContentScope } from "../../../../content/portfolio";

const RECOGNIZED_FLAGS = new Set(["--production", "--confirm-production"]);

export type PortfolioContentSyncArguments = {
  confirmProduction: boolean;
  isProduction: boolean;
  scopes: PortfolioContentScope[];
};

export function parsePortfolioContentSyncArguments(
  argumentsList: string[],
  availableScopes: readonly PortfolioContentScope[],
): PortfolioContentSyncArguments {
  const scopes = argumentsList.filter((argument) => !RECOGNIZED_FLAGS.has(argument));

  const unknownScopes = scopes.filter(
    (scope) => !availableScopes.includes(scope as PortfolioContentScope),
  );

  if (unknownScopes.length > 0) {
    throw new Error(
      `Unknown content scope: ${unknownScopes.join(", ")}. Allowed scopes: ${availableScopes.join(", ")}.`,
    );
  }

  return {
    confirmProduction: argumentsList.includes("--confirm-production"),
    isProduction: argumentsList.includes("--production"),
    scopes: scopes.length === 0 ? [...availableScopes] : (scopes as PortfolioContentScope[]),
  };
}

export async function executePortfolioContentSync<T>(
  argumentsResult: PortfolioContentSyncArguments,
  dependencies: {
    confirmProduction: () => void;
    sync: (scopes: PortfolioContentScope[]) => Promise<T>;
  },
): Promise<T> {
  if (argumentsResult.isProduction) {
    if (!argumentsResult.confirmProduction) {
      throw new Error("Production content sync requires the --confirm-production flag.");
    }

    dependencies.confirmProduction();
  }

  return dependencies.sync(argumentsResult.scopes);
}
