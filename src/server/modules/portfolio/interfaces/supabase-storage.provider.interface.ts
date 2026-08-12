export type PortfolioMediaUpload = { objectPath: string; body: Uint8Array; contentType: string };
export interface ISupabaseStorageProvider {
  ensurePublicBucket(): Promise<void>;
  hasObject(objectPath: string): Promise<boolean>;
  uploadIfMissing(asset: PortfolioMediaUpload): Promise<string>;
  getPublicUrl(objectPath: string): string;
}
export interface IPortfolioMediaStorageProvider extends ISupabaseStorageProvider {
  upload(asset: PortfolioMediaUpload): Promise<string>;
  removeObject(objectPath: string): Promise<void>;
  getObjectPath(publicUrl: string): string | null;
}
