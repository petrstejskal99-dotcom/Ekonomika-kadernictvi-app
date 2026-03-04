// Web-specific storage using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Service, Order, FixedCost, OneTimeCost, DEFAULT_SERVICES, DEFAULT_FIXED_COSTS, STORAGE_KEYS, StorageAdapter } from './storage.types';

export const createStorageAdapter = async (): Promise<StorageAdapter> => {
  const saveServices = async (services: Service[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  };

  const saveOrders = async (orders: Order[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  };

  const saveFixedCosts = async (costs: FixedCost[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(costs));
  };

  const saveOneTimeCosts = async (costs: OneTimeCost[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONE_TIME_COSTS, JSON.stringify(costs));
  };

  return {
    initialize: async () => {
      const [servicesData, ordersData, fixedCostsData, oneTimeCostsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SERVICES),
        AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS),
        AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS),
      ]);

      let services = servicesData ? JSON.parse(servicesData) : null;
      let fixedCosts = fixedCostsData ? JSON.parse(fixedCostsData) : null;
      const orders = ordersData ? JSON.parse(ordersData) : [];
      const oneTimeCosts = oneTimeCostsData ? JSON.parse(oneTimeCostsData) : [];

      if (!services) {
        services = DEFAULT_SERVICES;
        await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      }

      if (!fixedCosts) {
        fixedCosts = DEFAULT_FIXED_COSTS;
        await AsyncStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(fixedCosts));
      }

      return { services, orders, fixedCosts, oneTimeCosts };
    },

    addService: async (service) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      const services = data ? JSON.parse(data) : [];
      services.push(service);
      await saveServices(services);
    },

    updateService: async (service) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      let services = data ? JSON.parse(data) : [];
      services = services.map((s: Service) => s.id === service.id ? service : s);
      await saveServices(services);
    },

    deleteService: async (id) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      let services = data ? JSON.parse(data) : [];
      services = services.filter((s: Service) => s.id !== id);
      await saveServices(services);
    },

    addOrder: async (order) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders = data ? JSON.parse(data) : [];
      orders.push(order);
      await saveOrders(orders);
    },

    addFixedCost: async (cost) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
      const costs = data ? JSON.parse(data) : [];
      costs.push(cost);
      await saveFixedCosts(costs);
    },

    updateFixedCost: async (cost) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
      let costs = data ? JSON.parse(data) : [];
      costs = costs.map((c: FixedCost) => c.id === cost.id ? cost : c);
      await saveFixedCosts(costs);
    },

    deleteFixedCost: async (id) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
      let costs = data ? JSON.parse(data) : [];
      costs = costs.filter((c: FixedCost) => c.id !== id);
      await saveFixedCosts(costs);
    },

    addOneTimeCost: async (cost) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS);
      const costs = data ? JSON.parse(data) : [];
      costs.push(cost);
      await saveOneTimeCosts(costs);
    },

    deleteOneTimeCost: async (id) => {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONE_TIME_COSTS);
      let costs = data ? JSON.parse(data) : [];
      costs = costs.filter((c: OneTimeCost) => c.id !== id);
      await saveOneTimeCosts(costs);
    },
  };
};
