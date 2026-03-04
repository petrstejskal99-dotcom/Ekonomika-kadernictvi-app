import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Service, Order, FixedCost, OneTimeCost, StorageAdapter, DEFAULT_SERVICES, DEFAULT_FIXED_COSTS } from './storage.types';
import { createStorageAdapter } from './storage';

// Re-export types
export type { Service, Order, FixedCost, OneTimeCost };

interface AppContextType {
  services: Service[];
  orders: Order[];
  fixedCosts: FixedCost[];
  oneTimeCosts: OneTimeCost[];
  isLoading: boolean;
  addService: (s: Omit<Service, 'id'>) => void;
  updateService: (s: Service) => void;
  deleteService: (id: string) => void;
  addOrder: (o: Omit<Order, 'id'>) => void;
  addFixedCost: (c: Omit<FixedCost, 'id'>) => void;
  updateFixedCost: (c: FixedCost) => void;
  deleteFixedCost: (id: string) => void;
  addOneTimeCost: (c: Omit<OneTimeCost, 'id'>) => void;
  deleteOneTimeCost: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [oneTimeCosts, setOneTimeCosts] = useState<OneTimeCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storage, setStorage] = useState<StorageAdapter | null>(null);

  // Initialize storage and load data
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const adapter = await createStorageAdapter();
        setStorage(adapter);
        
        const data = await adapter.initialize();
        setServices(data.services);
        setOrders(data.orders);
        setFixedCosts(data.fixedCosts);
        setOneTimeCosts(data.oneTimeCosts);
        setIsLoading(false);
      } catch (error) {
        console.error('Storage initialization error:', error);
        // Fallback to defaults
        setServices(DEFAULT_SERVICES);
        setFixedCosts(DEFAULT_FIXED_COSTS);
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Service operations
  const addService = useCallback(async (s: Omit<Service, 'id'>) => {
    const newService: Service = { ...s, id: Date.now().toString() };
    
    // Update state immediately for UI responsiveness
    setServices(prev => [...prev, newService]);
    
    // Persist to storage
    if (storage) {
      try {
        await storage.addService(newService);
      } catch (error) {
        console.error('Error adding service:', error);
      }
    }
  }, [storage]);

  const updateService = useCallback(async (s: Service) => {
    // Update state immediately
    setServices(prev => prev.map(x => x.id === s.id ? s : x));
    
    // Persist to storage
    if (storage) {
      try {
        await storage.updateService(s);
      } catch (error) {
        console.error('Error updating service:', error);
      }
    }
  }, [storage]);

  const deleteService = useCallback(async (id: string) => {
    // Update state immediately
    setServices(prev => prev.filter(x => x.id !== id));
    
    // Persist to storage
    if (storage) {
      try {
        await storage.deleteService(id);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  }, [storage]);

  // Order operations
  const addOrder = useCallback(async (o: Omit<Order, 'id'>) => {
    const newOrder: Order = { ...o, id: Date.now().toString() };
    
    // Update state immediately
    setOrders(prev => [...prev, newOrder]);
    
    // Persist to storage
    if (storage) {
      try {
        await storage.addOrder(newOrder);
      } catch (error) {
        console.error('Error adding order:', error);
      }
    }
  }, [storage]);

  // Fixed cost operations
  const addFixedCost = useCallback(async (c: Omit<FixedCost, 'id'>) => {
    const newCost: FixedCost = { ...c, id: Date.now().toString() };
    
    // Update state immediately
    setFixedCosts(prev => [...prev, newCost]);
    
    // Persist to storage
    if (storage) {
      try {
        await storage.addFixedCost(newCost);
      } catch (error) {
        console.error('Error adding fixed cost:', error);
      }
    }
  }, [storage]);

  const updateFixedCost = useCallback(async (c: FixedCost) => {
    // Update state immediately
    setFixedCosts(prev => prev.map(x => x.id === c.id ? c : x));
    
    // Persist to storage
    if (storage) {
      try {
        await storage.updateFixedCost(c);
      } catch (error) {
        console.error('Error updating fixed cost:', error);
      }
    }
  }, [storage]);

  const deleteFixedCost = useCallback(async (id: string) => {
    // Update state immediately
    setFixedCosts(prev => prev.filter(x => x.id !== id));
    
    // Persist to storage
    if (storage) {
      try {
        await storage.deleteFixedCost(id);
      } catch (error) {
        console.error('Error deleting fixed cost:', error);
      }
    }
  }, [storage]);

  // One-time cost operations
  const addOneTimeCost = useCallback(async (c: Omit<OneTimeCost, 'id'>) => {
    const newCost: OneTimeCost = { ...c, id: Date.now().toString() };
    
    // Update state immediately
    setOneTimeCosts(prev => [...prev, newCost]);
    
    // Persist to storage
    if (storage) {
      try {
        await storage.addOneTimeCost(newCost);
      } catch (error) {
        console.error('Error adding one-time cost:', error);
      }
    }
  }, [storage]);

  const deleteOneTimeCost = useCallback(async (id: string) => {
    // Update state immediately
    setOneTimeCosts(prev => prev.filter(x => x.id !== id));
    
    // Persist to storage
    if (storage) {
      try {
        await storage.deleteOneTimeCost(id);
      } catch (error) {
        console.error('Error deleting one-time cost:', error);
      }
    }
  }, [storage]);

  return (
    <AppContext.Provider value={{
      services,
      orders,
      fixedCosts,
      oneTimeCosts,
      isLoading,
      addService,
      updateService,
      deleteService,
      addOrder,
      addFixedCost,
      updateFixedCost,
      deleteFixedCost,
      addOneTimeCost,
      deleteOneTimeCost,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
