const { execSync } = require('node:child_process');
const path = require('node:path');
const mariadb = require('mariadb');

// Apaga o banco de teste a cada execução; a trava do nome protege qualquer outro banco.
module.exports = async function resetTestDatabase() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error('Defina DATABASE_URL_TEST para rodar os testes de integração.');
  }
  const parsed = new URL(url);
  const database = parsed.pathname.slice(1);
  if (!/^[a-z0-9_]+_test$/.test(database)) {
    throw new Error('O nome do banco em DATABASE_URL_TEST precisa terminar em _test.');
  }
  const connection = await mariadb.createConnection({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    allowPublicKeyRetrieval: true,
  });
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.query(`CREATE DATABASE \`${database}\``);
  await connection.end();
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });
};
