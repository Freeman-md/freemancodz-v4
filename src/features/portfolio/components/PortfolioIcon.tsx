import { createElement, type ComponentProps } from "react";
import { resolvePortfolioIcon } from "../models/icon-registry";

export function PortfolioIcon({
  name,
  ...props
}: Omit<ComponentProps<"svg">, "name"> & { name: string | null }) {
  const Icon = resolvePortfolioIcon(name);

  return Icon ? createElement(Icon, props) : null;
}
