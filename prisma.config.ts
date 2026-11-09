import { config } from "dotenv";
import { defineConfig } from "prisma/config";

if (!process.env.DATABASE_URL) {
  config({ path: ".env", quiet: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` does not need a connection, while database commands do.
    url: process.env.DATABASE_URL ?? "",
  },
});
