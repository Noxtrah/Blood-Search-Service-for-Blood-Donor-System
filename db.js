// db.js
import sql from 'mssql';
import { dbConfig } from './dbConfig.js';

let pool;

export async function connectToDatabase() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
    }
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectToDatabase first.');
  }
  return pool;
}