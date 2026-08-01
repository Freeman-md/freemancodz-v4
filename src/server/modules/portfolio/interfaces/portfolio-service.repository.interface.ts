import type { Service } from "@/generated/prisma/client";
export interface IPortfolioServiceRepository {
  findAll(): Promise<Service[]>;
}
