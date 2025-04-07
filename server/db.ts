import { drizzle } from "drizzle-orm/postgres-js";
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Utilizando os dados do banco de dados
const queryClient = postgres(process.env.DATABASE_URL!);

export const db = drizzle(queryClient, { schema });