// Web fallback - uses AsyncStorage instead of SQLite
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SERVICES: '@salon_services',
  ORDERS: '@salon_orders',
  FIXED_COSTS: '@salon_fixed_costs',
  ONE_TIME_COSTS: '@salon_one_time_costs',
  MONTHLY_ARCHIVE: '@salon_monthly_archive',
};

// Mock database interface for web
export interface WebDatabase {
  getAllAsync: <T>(query: string) => Promise<T[]>;
  runAsync: (query: string, params?: any[]) => Promise<void>;
  execAsync: (query: string) => Promise<void>;
}

let initialized = false;

export const getDatabase = async (): Promise<WebDatabase> => {
  if (!initialized) {
    // Initialize default data if not exists
    const services = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!services) {
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, '[]');
    }
    const orders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!orders) {
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, '[]');
    }
    const fixedCosts = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
    if (!fixedCosts) {
      await AsyncStorage.setItem(STORAGE_KEYS.FIXED_COSTS, '[]');
    }
    const oneTimeCosts = await AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS);
    if (!oneTimeCosts) {
      await AsyncStorage.setItem(STORAGE_KEYS.ONE_TIME_COSTS, '[]');
    }
    const archive = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_ARCHIVE);
    if (!archive) {
      await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVE, '[]');
    }
    initialized = true;
  }

  return {
    getAllAsync: async <T>(query: string): Promise<T[]> => {
      if (query.includes('services')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
        return data ? JSON.parse(data) : [];
      }
      if (query.includes('monthly_archive')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_ARCHIVE);
        return data ? JSON.parse(data) : [];
      }
      if (query.includes('orders')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
        return data ? JSON.parse(data) : [];
      }
      if (query.includes('fixed_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
        return data ? JSON.parse(data) : [];
      }
      if (query.includes('one_time_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS);
        return data ? JSON.parse(data) : [];
      }
      return [];
    },

    runAsync: async (query: string, params?: any[]): Promise<void> => {
      // Parse query and execute appropriate AsyncStorage operation
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('insert into services')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
        const services = data ? JSON.parse(data) : [];
        services.push({ id: params![0], name: params![1], price: params![2], materialCost: params![3] });
        await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      }
      else if (lowerQuery.includes('update services')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
        let services = data ? JSON.parse(data) : [];
        const id = params![3];
        services = services.map((s: any) => s.id === id ? { ...s, name: params![0], price: params![1], materialCost: params![2] } : s);
        await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      }
      else if (lowerQuery.includes('delete from services')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
        let services = data ? JSON.parse(data) : [];
        services = services.filter((s: any) => s.id !== params![0]);
        await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      }
      else if (lowerQuery.includes('insert into orders')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
        const orders = data ? JSON.parse(data) : [];
        orders.push({ id: params![0], serviceName: params![1], price: params![2], materialCost: params![3], timestamp: params![4] });
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
      else if (lowerQuery.includes('delete from orders')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
        let orders = data ? JSON.parse(data) : [];
        if (params && params.length > 0) {
          orders = orders.filter((o: any) => !params.includes(o.id));
        }
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
      else if (lowerQuery.includes('insert into fixed_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
        const costs = data ? JSON.parse(data) : [];
        costs.push({ id: params![0], name: params![1], amount: params![2] });
        await AsyncStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(costs));
      }
      else if (lowerQuery.includes('update fixed_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
        let costs = data ? JSON.parse(data) : [];
        const id = params![2];
        costs = costs.map((c: any) => c.id === id ? { ...c, name: params![0], amount: params![1] } : c);
        await AsyncStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(costs));
      }
      else if (lowerQuery.includes('delete from fixed_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
        let costs = data ? JSON.parse(data) : [];
        costs = costs.filter((c: any) => c.id !== params![0]);
        await AsyncStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(costs));
      }
      else if (lowerQuery.includes('insert into one_time_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS);
        const costs = data ? JSON.parse(data) : [];
        costs.push({ id: params![0], name: params![1], amount: params![2], date: params![3] });
        await AsyncStorage.setItem(STORAGE_KEYS.ONE_TIME_COSTS, JSON.stringify(costs));
      }
      else if (lowerQuery.includes('delete from one_time_costs')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS);
        let costs = data ? JSON.parse(data) : [];
        if (params && params.length > 0) {
          costs = costs.filter((c: any) => c.id !== params![0]);
        } else {
          costs = []; // Clear all
        }
        await AsyncStorage.setItem(STORAGE_KEYS.ONE_TIME_COSTS, JSON.stringify(costs));
      }
      else if (lowerQuery.includes('insert into monthly_archive')) {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_ARCHIVE);
        const archives = data ? JSON.parse(data) : [];
        archives.push({
          id: params![0],
          year: params![1],
          month: params![2],
          label: params![3],
          revenue: params![4],
          materialCosts: params![5],
          fixedCosts: params![6],
          oneTimeCosts: params![7],
          netProfit: params![8],
          ordersCount: params![9],
          closedAt: params![10],
        });
        await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_ARCHIVE, JSON.stringify(archives));
      }
    },

    execAsync: async (_query: string): Promise<void> => {
      // No-op for web - tables are virtual
    },
  };
};
