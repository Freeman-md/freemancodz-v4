import type { ActionBlockWithBase } from "../models/portfolio-records";
import type { UpsertActionBlockInput } from "@/contracts/portfolio-admin.contract";
export interface IActionBlockRepository {
  findById(id: string): Promise<ActionBlockWithBase | null>;
  findAll(): Promise<ActionBlockWithBase[]>;
}
export interface IActionBlockAdministrationRepository extends IActionBlockRepository {
  create(input: UpsertActionBlockInput): Promise<string>;
  update(id: string, input: UpsertActionBlockInput): Promise<void>;
  delete(id: string): Promise<void>;
}
