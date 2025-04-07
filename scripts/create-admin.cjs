const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require('postgres');
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");
const { eq, sql } = require("drizzle-orm");

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log("Conectando ao banco de dados...");
    const queryClient = postgres(process.env.DATABASE_URL);
    const db = drizzle(queryClient);
    
    console.log("Verificando se já existe um usuário administrador...");
    const existingAdmins = await db.execute(sql`SELECT * FROM users WHERE role = 'master'`);
    
    if (existingAdmins.length === 0) {
      console.log("Criando usuário administrador...");
      const adminUser = {
        username: 'admin',
        password: await hashPassword('admin123'),
        name: 'Administrador',
        email: 'admin@ofm.com',
        role: 'master'
      };
      
      const newAdmin = await db.execute(sql`
        INSERT INTO users (username, password, name, email, role)
        VALUES (${adminUser.username}, ${adminUser.password}, ${adminUser.name}, 
               ${adminUser.email}, ${adminUser.role})
        RETURNING *
      `).then(rows => rows[0]);
      console.log('Usuário administrador criado com sucesso!');
      console.log('ID:', newAdmin.id);
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Já existe um usuário administrador:');
      console.log('ID:', existingAdmins[0].id);
      console.log('Username:', existingAdmins[0].username);
    }
    
    await queryClient.end();
    console.log("Conexão com banco de dados encerrada.");
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  }
}

createAdminUser();