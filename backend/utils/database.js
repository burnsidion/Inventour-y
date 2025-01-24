import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Database conncected successfully!');
});

pool.on('error', (err) => {
    console.log('Database connection error!' , err);
});

export default pool;