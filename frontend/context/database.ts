import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('salon.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        materialCost INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        serviceName TEXT NOT NULL,
        price INTEGER NOT NULL,
        materialCost INTEGER NOT NULL,
        timestamp TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS fixed_costs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS one_time_costs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS monthly_archive (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        label TEXT NOT NULL,
        revenue INTEGER NOT NULL,
        materialCosts INTEGER NOT NULL,
        fixedCosts INTEGER NOT NULL,
        oneTimeCosts INTEGER NOT NULL,
        netProfit INTEGER NOT NULL,
        ordersCount INTEGER NOT NULL,
        closedAt TEXT NOT NULL
      );
    `);
  }
  return db;
};
