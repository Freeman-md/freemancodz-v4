import type { IconBlock } from "@/generated/prisma/client";
export interface IIconBlockRepository {
  findById(id: string): Promise<IconBlock | null>;
}
