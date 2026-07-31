import type { Project } from "@/generated/prisma/client";
export interface IProjectRepository { findAll(): Promise<Project[]>; findFeatured(): Promise<Project[]>; }
