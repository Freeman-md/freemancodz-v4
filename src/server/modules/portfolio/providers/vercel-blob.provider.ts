import "server-only";

import { get } from "@vercel/blob";

export async function getPrivateBlob(pathname: string) {
  return get(pathname, { access: "private" });
}
