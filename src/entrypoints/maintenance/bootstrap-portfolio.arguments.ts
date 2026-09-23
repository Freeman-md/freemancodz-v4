export type PortfolioBootstrapArguments = {
  production: boolean;
};

export function parsePortfolioBootstrapArguments(
  argv: readonly string[],
): PortfolioBootstrapArguments {
  const production = argv.includes("--production");

  if (production && !argv.includes("--confirm-production")) {
    throw new Error(
      "Production bootstrap requires an operator-supplied --confirm-production argument.",
    );
  }

  return { production };
}
