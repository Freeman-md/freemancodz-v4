import type { ContentBlock, ContentPage, ContentSection } from "@/generated/prisma/client";
export interface IContentBlockRepository {
  findRequiredByKey(key: string): Promise<ContentBlock>;
  findBySection(page: ContentPage, section: ContentSection): Promise<ContentBlock[]>;
}
