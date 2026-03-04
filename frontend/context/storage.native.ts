// Native-specific storage using expo-sqlite
import * as SQLite from 'expo-sqlite';
import { Service, Order, FixedCost, OneTimeCost, DEFAULT_SERVICES, DEFAULT_FIXED_COSTS, StorageAdapter } from './storage.types';

export const createStorageAdapter = async (): Promise<StorageAdapter> => {
  const db = await SQLite.openDatabaseAsync('salon.db');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      defaultPrice INTEGER NOT NULL,
      materialCost INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      serviceName TEXT NOT NULL,
      price INTEGER NOT NULL,
      materialCost INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fixed_costs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      monthlyAmount INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS one_time_costs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date INTEGER NOT NULL
    );
  `);

  return {
    initialize: async () => {
      const loadedServices = await db.getAllAsync<Service>('SELECT * FROM services');
      const loadedOrders = await db.getAllAsync<Order>('SELECT * FROM orders');
      const loadedFixedCosts = await db.getAllAsync<FixedCost>('SELECT * FROM fixed_costs');
      const loadedOneTimeCosts = await db.getAllAsync<OneTimeCost>('SELECT * FROM one_time_costs');

      let services = loadedServices;
      let fixedCosts = loadedFixedCosts;

      // If services table is empty, insert DEFAULT_SERVICES
      if (loadedServices.length === 0) {
        for (const service of DEFAULT_SERVICES) {
          await db.runAsync(
            'INSERT INTO services (id, name, defaultPrice, materialCost) VALUES (?, ?, ?, ?)',
            [service.id, service.name, service.defaultPrice, service.materialCost]
          );
        }
        services = DEFAULT_SERVICES;
      }

      // If fixed_costs table is empty, insert DEFAULT_FIXED_COSTS
      if (loadedFixedCosts.length === 0) {
        for (const cost of DEFAULT_FIXED_COSTS) {
          await db.runAsync(
            'INSERT INTO fixed_costs (id, name, monthlyAmount) VALUES (?, ?, ?)',
            [cost.id, cost.name, cost.monthlyAmount]
          );
        }
        fixedCosts = DEFAULT_FIXED_COSTS;
      }

      return { services, orders: loadedOrders, fixedCosts, oneTimeCosts: loadedOneTimeCosts };
    },

    addService: async (service) => {
      await db.runAsync(
        'INSERT INTO services (id, name, defaultPrice, materialCost) VALUES (?, ?, ?, ?)',
        [service.id, service.name, service.defaultPrice, service.materialCost]
      );
    },

    updateService: async (service) => {
      await db.runAsync(
        'UPDATE services SET name = ?, defaultPrice = ?, materialCost = ? WHERE id = ?',
        [service.name, service.defaultPrice, service.materialCost, service.id]
      );
    },

    deleteService: async (id) => {
      await db.runAsync('DELETE FROM services WHERE id = ?', [id]);
    },

    addOrder: async (order) => {
      await db.runAsync(
        'INSERT INTO orders (id, serviceName, price, materialCost, timestamp) VALUES (?, ?, ?, ?, ?)',
        [order.id, order.serviceName, order.price, order.materialCost, order.timestamp]
      );
    },

    addFixedCost: async (cost) => {
      await db.runAsync(
        'INSERT INTO fixed_costs (id, name, monthlyAmount) VALUES (?, ?, ?)',
        [cost.id, cost.name, cost.monthlyAmount]
      );
    },

    updateFixedCost: async (cost) => {
      await db.runAsync(
        'UPDATE fixed_costs SET name = ?, monthlyAmount = ? WHERE id = ?',
        [cost.name, cost.monthlyAmount, cost.id]
      );
    },

    deleteFixedCost: async (id) => {
      await db.runAsync('DELETE FROM fixed_costs WHERE id = ?', [id]);
    },

    addOneTimeCost: async (cost) => {
      await db.runAsync(
        'INSERT INTO one_time_costs (id, name, amount, date) VALUES (?, ?, ?, ?)',
        [cost.id, cost.name, cost.amount, cost.date]
      );
    },

    deleteOneTimeCost: async (id) => {
      await db.runAsync('DELETE FROM one_time_costs WHERE id = ?', [id]);
    },
  };
};
