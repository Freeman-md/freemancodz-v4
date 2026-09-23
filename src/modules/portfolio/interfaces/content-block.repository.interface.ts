import type { ContentBlockNode } from "../models/portfolio-records";
import type { OrderedRelationInput } from "@/contracts/portfolio-admin.contract";
import type { UpdateContentBlockInput } from "../models/portfolio-administration";
export type PortfolioPagePath = "/" | "/work" | "/about" | "/audit";
export interface IContentBlockRepository {
  findPageTree(page: PortfolioPagePath): Promise<ContentBlockNode[]>;
}
export interface IContentBlockAdministrationRepository extends IContentBlockRepository {
  update(id: string, input: UpdateContentBlockInput): Promise<void>;
  replaceChildren(id: string, children: OrderedRelationInput[]): Promise<void>;
  replaceIcons(id: string, icons: OrderedRelationInput[]): Promise<void>;
  replaceMedia(id: string, media: OrderedRelationInput[]): Promise<void>;
  replaceActions(id: string, actions: OrderedRelationInput[]): Promise<void>;
}
