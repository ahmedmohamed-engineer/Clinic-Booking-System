import pg from "pg";
import { database, env } from "../config/index.js";

export const pool = new pg.Pool({
  host: database.host,
  port: database.port,
  database: database.name,
  user: database.user,
  password: database.password,
  ...(env.NODE_ENV === "production"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export async function connectDatabase(): Promise<void> {
  try {
    const client = await pool.connect();

    try {
      const result = await client.query<{
        current_time: Date;
      }>("SELECT NOW() AS current_time");

      console.log("✓ Database connected");
      console.log("Database Time :", result.rows[0].current_time);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}