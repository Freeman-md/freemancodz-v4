export type PortfolioMediaUpload = { objectPath: string; body: Uint8Array; contentType: string };
export interface ISupabaseStorageProvider {
  ensurePublicBucket(): Promise<void>;
  hasObject(objectPath: string): Promise<boolean>;
  uploadIfMissing(asset: PortfolioMediaUpload): Promise<string>;
  getPublicUrl(objectPath: string): string;
}
