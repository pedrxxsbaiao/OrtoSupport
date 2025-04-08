import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runMigrations() {
  console.log('Running migrations...');

  try {
    // Criar tabela de usuários
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created');

    // Criar tabela de perguntas
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        lesson TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Questions table created');

    // Criar tabela de feedback
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        is_helpful BOOLEAN NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Feedback table created');

    // Criar tabela de sugestões
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS suggestions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Suggestions table created');

    // Adicionar coluna content à tabela de sugestões se não existir
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'suggestions' AND column_name = 'content'
        ) THEN
          ALTER TABLE suggestions ADD COLUMN content TEXT NOT NULL DEFAULT '';
        END IF;
      END $$;
    `);
    console.log('Content column added to suggestions table');

    // Criar tabela de sessões
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Verificar se a tabela existe
        IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'session') THEN
          CREATE TABLE "session" (
            "sid" varchar NOT NULL COLLATE "default",
            "sess" json NOT NULL,
            "expire" timestamp(6) NOT NULL
          );
        END IF;

        -- Verificar se a constraint existe
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'session_pkey'
        ) THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
        END IF;
      END $$;
    `);
    console.log('Session table created');

    // Inserir sugestão sobre indicações da ortopedia funcional dos maxilares
    await db.execute(sql`
      INSERT INTO suggestions (title, description, content, active)
      VALUES (
        'Indicações da Ortopedia Funcional dos Maxilares',
        'Principais indicações e aplicações da ortopedia funcional dos maxilares',
        'A ortopedia funcional dos maxilares é indicada para:

1. Correção de maloclusões em crianças e adolescentes
2. Tratamento de problemas de crescimento facial
3. Correção de hábitos deletérios (sucção digital, respiração bucal)
4. Melhora da função mastigatória
5. Estímulo do crescimento mandibular
6. Correção de mordida cruzada posterior
7. Tratamento de apinhamento dentário
8. Melhora da estética facial
9. Correção de problemas de ATM
10. Tratamento de distúrbios do sono relacionados à respiração

É importante ressaltar que o tratamento deve ser iniciado precocemente, preferencialmente durante a fase de crescimento, para obter melhores resultados.',
        true
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('Sample suggestion inserted');

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
} 