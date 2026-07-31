import type { Experience } from "@/generated/prisma/client";
export interface IExperienceRepository { findAll(): Promise<Experience[]>; }
