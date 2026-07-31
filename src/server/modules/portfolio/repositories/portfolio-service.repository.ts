import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IPortfolioServiceRepository } from "../interfaces/portfolio-service.repository.interface";
export class PortfolioServiceRepository implements IPortfolioServiceRepository { constructor(private readonly database: PrismaClient) {} findAll() { return this.database.service.findMany({ orderBy: { position: "asc" } }); } }
