import type { IconBlock } from "@/generated/prisma/client";
import type { UpsertIconBlockInput } from "@/contracts/portfolio-admin.contract";
import type { ReusableBlockReferences } from "../models/portfolio-administration";
export interface IIconBlockRepository {
  findById(id: string): Promise<IconBlock | null>;
  findAll(): Promise<IconBlock[]>;
}
export interface IIconBlockAdministrationRepository extends IIconBlockRepository {
  create(input: UpsertIconBlockInput): Promise<string>;
  update(id: string, input: UpsertIconBlockInput): Promise<void>;
  delete(id: string): Promise<void>;
  countReferences(id: string): Promise<ReusableBlockReferences>;
}
