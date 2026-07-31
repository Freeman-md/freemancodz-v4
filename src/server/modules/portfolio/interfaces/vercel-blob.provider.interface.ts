export interface IVercelBlobProvider { getPrivate(pathname: string): Promise<{ stream: ReadableStream | null; blob: { contentType?: string | null } } | null>; }
