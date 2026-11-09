"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";

const subscribe = () => () => {};

const clientSnapshot = () => true;

const serverSnapshot = () => false;

export function SiteAnalytics() {
  // Analytics reads search params that are unavailable in Next's 404 render.
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  return mounted ? <Analytics /> : null;
}
