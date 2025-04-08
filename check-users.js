import postgres from 'postgres';

const sql = postgres("postgresql://ortosupport_user:A2UxKWJDwWUc6kAQ3cNC8OBqYwiDzQyO@dpg-cvq0qt3uibrs7386nlg0-a.oregon-postgres.render.com/ortosupport");

async function checkUsers() {
  try {
    const users = await sql`SELECT id, username, name, email, role, created_at FROM users`;
    console.log("Usuários encontrados:");
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Erro ao consultar usuários:", error);
  } finally {
    await sql.end();
  }
}

checkUsers(); 