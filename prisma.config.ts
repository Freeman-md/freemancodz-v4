import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/server/entrypoints/maintenance/bootstrap-portfolio.ts",
  },
  datasource: {
    // `prisma generate` does not need a connection, while database commands do.
    url: process.env.DATABASE_URL ?? "",
  },
});
