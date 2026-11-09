import { readFile } from "node:fs/promises";
import type { Client } from "pg";

export async function applyPrismaMigration(database: Client, directory: string) {
  if (directory === "20260901090000_simplify_audit_presentation") {
    // The historical data migration ran against an initialized audit page.
    await database.query(`
      INSERT INTO public.content_blocks (title, url, "order") VALUES
        ('Before and after', '/audit#audit-before-after', 2),
        ('Symptoms', '/audit#audit-why', 3),
        ('Proof', '/audit#audit-proof', 4),
        ('Request', '/audit#audit-cta', 5);
    `);
  }

  const sql = await readFile(`prisma/migrations/${directory}/migration.sql`, "utf8");

  await database.query(sql);
}
