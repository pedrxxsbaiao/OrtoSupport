import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';

const pool = new Pool({
  connectionString: "postgresql://ortosupport_user:A2UxKWJDwWUc6kAQ3cNC8OBqYwiDzQyO@dpg-cvq0qt3uibrs7386nlg0-a.oregon-postgres.render.com/ortosupport",
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        email TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabela users criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela users:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function createAdminUser() {
  const client = await pool.connect();
  try {
    await createTables();
    
    const hashedPassword = await hashPassword("helio_2025");
    
    const result = await client.query(`
      INSERT INTO users (username, password, name, email, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, name, email, role, created_at
    `, ['helio', hashedPassword, 'Helio', 'helio@admin.com', 'master']);
    
    if (result.rows.length > 0) {
      console.log("Usuário administrador criado com sucesso:");
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log("Usuário já existe ou houve um erro ao criar.");
    }
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser(); 