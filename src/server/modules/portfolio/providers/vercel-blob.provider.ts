import "server-only";

import type {
  IVercelBlobClient,
  IVercelBlobProvider,
} from "../interfaces/vercel-blob.provider.interface";

export class VercelBlobProvider implements IVercelBlobProvider {
  constructor(private readonly client: IVercelBlobClient) {}

  getPrivate(pathname: string) {
    return this.client.get(pathname, { access: "private" });
  }
}
