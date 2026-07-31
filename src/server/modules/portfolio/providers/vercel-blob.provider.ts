import "server-only";

import { get } from "@vercel/blob";
import type { IVercelBlobProvider } from "../interfaces/vercel-blob.provider.interface";

export class VercelBlobProvider implements IVercelBlobProvider { getPrivate(pathname: string) { return get(pathname, { access: "private" }); } }
