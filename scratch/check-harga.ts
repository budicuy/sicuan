import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "../db";
import { hargaSampah } from "../db/schema";

async function main() {
  const dateStr = "2026-06-05";
  console.log(`QUERYING FOR "Karton" ON DATE: ${dateStr} WITH id DESC SORT`);

  const result = await db
    .select()
    .from(hargaSampah)
    .where(
      and(
        eq(hargaSampah.jenisSampah, "Karton"),
        lte(hargaSampah.periode, dateStr),
      ),
    )
    .orderBy(desc(hargaSampah.periode), desc(hargaSampah.id))
    .limit(1);

  console.log("RESULT:");
  console.log(result[0] || "NULL");
}

main().catch(console.error);
