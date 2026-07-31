import type { Principle } from "@/generated/prisma/client";
export interface IPrincipleRepository { findBySection(section: string): Promise<Principle[]>; }
