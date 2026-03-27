import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const createPool = (): Pool =>
  new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

declare global {
  // biome-ignore lint/style/noVar: required for globalThis augmentation
  var _pgPool: Pool | undefined;
}

const pool: Pool = globalThis._pgPool ?? (globalThis._pgPool = createPool());

export const db = drizzle(pool);
