import type { get } from "@vercel/blob";

export interface IVercelBlobClient { get(pathname: string, options: { access: "private" }): ReturnType<typeof get>; }
export interface IVercelBlobProvider { getPrivate(pathname: string): Promise<{ stream: ReadableStream | null; blob: { contentType?: string | null } } | null>; }
