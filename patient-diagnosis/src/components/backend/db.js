import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Dispensary',
  password: 'Sharan@123',
  port: 5432
});

export default pool;
