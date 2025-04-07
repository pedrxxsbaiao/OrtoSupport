import { drizzle } from "drizzle-orm/postgres-js";
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Utilizando os dados do banco de dados
const queryClient = postgres(process.env.DATABASE_URL!, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10
});

export const db = drizzle(queryClient, { schema });