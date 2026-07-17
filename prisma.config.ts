import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Supabase SQL migrations are the only migration history for this project.
  datasource: {
    // `prisma generate` does not need a connection, while database commands do.
    url: process.env.DATABASE_URL ?? "",
  },
});
