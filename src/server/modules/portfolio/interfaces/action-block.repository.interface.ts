import type { ActionBlockWithBase } from "../models/portfolio-records";
export interface IActionBlockRepository {
  findById(id: string): Promise<ActionBlockWithBase | null>;
}
