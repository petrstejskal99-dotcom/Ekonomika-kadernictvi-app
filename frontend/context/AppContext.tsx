import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

// Types
export interface Service {
  id: string;
  name: string;
  price: number;
  materialCost: number;
}

export interface Order {
  id: string;
  serviceName: string;
  price: number;
  materialCost: number;
  timestamp: string;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
}

export interface OneTimeCost {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export interface MonthlyArchive {
  id: string;
  year: number;
  month: number;
  label: string;
  revenue: number;
  materialCosts: number;
  fixedCosts: number;
  oneTimeCosts: number;
  netProfit: number;
  ordersCount: number;
  closedAt: string;
}

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Dámský střih', price: 450, materialCost: 20 },
  { id: '2', name: 'Dámský střih + foukaná', price: 650, materialCost: 25 },
  { id: '3', name: 'Pánský střih', price: 280, materialCost: 15 },
  { id: '4', name: 'Dětský střih (do 12 let)', price: 220, materialCost: 10 },
  { id: '5', name: 'Mytí vlasů + foukaná', price: 350, materialCost: 30 },
  { id: '6', name: 'Foukaná vlasů', price: 280, materialCost: 20 },
  { id: '7', name: 'Blow dry (kartáčování)', price: 320, materialCost: 20 },
  { id: '8', name: 'Styling + účes', price: 400, materialCost: 30 },
  { id: '9', name: 'Barvení celých vlasů', price: 900, materialCost: 150 },
  { id: '10', name: 'Barvení celých vlasů + střih + foukaná', price: 1400, materialCost: 170 },
  { id: '11', name: 'Dobarvení odrostů', price: 650, materialCost: 100 },
  { id: '12', name: 'Dobarvení odrostů + střih + foukaná', price: 1100, materialCost: 120 },
  { id: '13', name: 'Přeliv celých vlasů', price: 750, materialCost: 120 },
  { id: '14', name: 'Zesvětlení vlasů (blonding)', price: 1200, materialCost: 200 },
  { id: '15', name: 'Stahování barvy (stripping)', price: 800, materialCost: 180 },
  { id: '16', name: 'Melír klasický', price: 1200, materialCost: 250 },
  { id: '17', name: 'Balayage', price: 1800, materialCost: 350 },
  { id: '18', name: 'Ombre', price: 1600, materialCost: 300 },
  { id: '19', name: 'Air touch', price: 2200, materialCost: 400 },
  { id: '20', name: 'Hair tattoo (holení vzoru)', price: 350, materialCost: 20 },
  { id: '21', name: 'Keratinová péče', price: 1500, materialCost: 400 },
  { id: '22', name: 'Laminace vlasů', price: 1200, materialCost: 350 },
  { id: '23', name: 'Narovnávání vlasů', price: 1800, materialCost: 450 },
  { id: '24', name: 'Trvalá ondulace', price: 900, materialCost: 200 },
  { id: '25', name: 'Vlasová kúra (maska)', price: 350, materialCost: 80 },
  { id: '26', name: 'Malibu C (odmineral.)', price: 600, materialCost: 150 },
  { id: '27', name: 'Vlasová ozónoterapie', price: 700, materialCost: 100 },
  { id: '28', name: 'Head spa', price: 800, materialCost: 120 },
  { id: '29', name: 'Masáž hlavy', price: 300, materialCost: 20 },
  { id: '30', name: 'Diagnostika vlasů', price: 200, materialCost: 10 },
  { id: '31', name: 'Konzultace', price: 0, materialCost: 0 },
  { id: '32', name: 'Prodlužování vlasů (za pás)', price: 3000, materialCost: 800 },
  { id: '33', name: 'Zaplétání vlasů', price: 500, materialCost: 20 },
  { id: '34', name: 'Společenský účes', price: 700, materialCost: 40 },
  { id: '35', name: 'Svatební účes', price: 1500, materialCost: 60 },
  { id: '36', name: 'Zkouška účesu', price: 1000, materialCost: 40 },
];

const DEFAULT_FIXED_COSTS: FixedCost[] = [
  { id: '1', name: 'Nájem', amount: 0 },
  { id: '2', name: 'Elektřina', amount: 0 },
  { id: '3', name: 'Internet', amount: 0 },
  { id: '4', name: 'Pojištění', amount: 0 },
];

const CZECH_MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

interface AppContextType {
  services: Service[];
  orders: Order[];
  fixedCosts: FixedCost[];
  oneTimeCosts: OneTimeCost[];
  monthlyArchives: MonthlyArchive[];
  isLoading: boolean;
  addService: (s: Omit<Service, 'id'>) => void;
  updateService: (s: Service) => void;
  deleteService: (id: string) => void;
  addOrder: (o: Omit<Order, 'id' | 'timestamp'>) => void;
  addFixedCost: (c: Omit<FixedCost, 'id'>) => void;
  updateFixedCost: (c: FixedCost) => void;
  deleteFixedCost: (id: string) => void;
  addOneTimeCost: (c: Omit<OneTimeCost, 'id' | 'date'>) => void;
  deleteOneTimeCost: (id: string) => void;
  performMonthlyClose: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// Check if running on native platform
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [oneTimeCosts, setOneTimeCosts] = useState<OneTimeCost[]>([]);
  const [monthlyArchives, setMonthlyArchives] = useState<MonthlyArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [db, setDb] = useState<any>(null);

  // Check and perform auto-close on startup
  const checkMonthlyClose = useCallback(async (database: any, loadedOrders: Order[], loadedFixedCosts: FixedCost[], loadedOneTimeCosts: OneTimeCost[]) => {
    if (loadedOrders.length === 0) return { orders: loadedOrders, oneTimeCosts: loadedOneTimeCosts, newArchive: null };

    const sortedOrders = [...loadedOrders].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const oldestOrder = sortedOrders[0];
    const orderDate = new Date(oldestOrder.timestamp);
    const now = new Date();

    // If oldest order is from previous month, auto-archive
    if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) {
      const month = orderDate.getMonth();
      const year = orderDate.getFullYear();

      // Get orders for that specific month
      const monthOrders = loadedOrders.filter(o => {
        const d = new Date(o.timestamp);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      const revenue = monthOrders.reduce((s, o) => s + o.price, 0);
      const materialCosts = monthOrders.reduce((s, o) => s + o.materialCost, 0);
      const fixedTotal = loadedFixedCosts.reduce((s, c) => s + c.amount, 0);
      const oneTimeTotal = loadedOneTimeCosts.reduce((s, c) => s + c.amount, 0);
      const netProfit = revenue - materialCosts - fixedTotal - oneTimeTotal;

      const archive: MonthlyArchive = {
        id: Date.now().toString(),
        year,
        month: month + 1,
        label: `${CZECH_MONTHS[month]} ${year}`,
        revenue,
        materialCosts,
        fixedCosts: fixedTotal,
        oneTimeCosts: oneTimeTotal,
        netProfit,
        ordersCount: monthOrders.length,
        closedAt: new Date().toISOString(),
      };

      // Save archive to SQLite
      await database.runAsync(
        `INSERT INTO monthly_archive VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [archive.id, archive.year, archive.month, archive.label,
         archive.revenue, archive.materialCosts, archive.fixedCosts,
         archive.oneTimeCosts, archive.netProfit, archive.ordersCount,
         archive.closedAt]
      );

      // Clear orders for closed month
      if (monthOrders.length > 0) {
        const placeholders = monthOrders.map(() => '?').join(',');
        await database.runAsync(`DELETE FROM orders WHERE id IN (${placeholders})`,
          monthOrders.map(o => o.id));
      }

      // Clear one-time costs
      await database.runAsync(`DELETE FROM one_time_costs`);

      // Return updated data
      const remainingOrders = loadedOrders.filter(o => {
        const d = new Date(o.timestamp);
        return !(d.getMonth() === month && d.getFullYear() === year);
      });

      return { orders: remainingOrders, oneTimeCosts: [], newArchive: archive };
    }

    return { orders: loadedOrders, oneTimeCosts: loadedOneTimeCosts, newArchive: null };
  }, []);

  // Initialize database and load data
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        let database: any;
        
        if (isNative) {
          const { getDatabase } = require('./database');
          database = await getDatabase();
        } else {
          const { getDatabase } = require('./database.web');
          database = await getDatabase();
        }
        
        setDb(database);

        // Load all data from SQLite
        let loadedServices = await database.getAllAsync<Service>('SELECT * FROM services');
        let loadedOrders = await database.getAllAsync<Order>('SELECT * FROM orders');
        let loadedFixedCosts = await database.getAllAsync<FixedCost>('SELECT * FROM fixed_costs');
        let loadedOneTimeCosts = await database.getAllAsync<OneTimeCost>('SELECT * FROM one_time_costs');
        const loadedArchives = await database.getAllAsync<MonthlyArchive>('SELECT * FROM monthly_archive');

        // If services table is empty on first launch, insert DEFAULT_SERVICES
        if (loadedServices.length === 0) {
          for (const service of DEFAULT_SERVICES) {
            await database.runAsync(
              'INSERT INTO services (id, name, price, materialCost) VALUES (?, ?, ?, ?)',
              [service.id, service.name, service.price, service.materialCost]
            );
          }
          loadedServices = DEFAULT_SERVICES;
        }

        // If fixed_costs table is empty, insert DEFAULT_FIXED_COSTS
        if (loadedFixedCosts.length === 0) {
          for (const cost of DEFAULT_FIXED_COSTS) {
            await database.runAsync(
              'INSERT INTO fixed_costs (id, name, amount) VALUES (?, ?, ?)',
              [cost.id, cost.name, cost.amount]
            );
          }
          loadedFixedCosts = DEFAULT_FIXED_COSTS;
        }

        // Check for auto-close of previous month
        const { orders: updatedOrders, oneTimeCosts: updatedOneTimeCosts, newArchive } = 
          await checkMonthlyClose(database, loadedOrders, loadedFixedCosts, loadedOneTimeCosts);

        setServices(loadedServices);
        setOrders(updatedOrders);
        setFixedCosts(loadedFixedCosts);
        setOneTimeCosts(updatedOneTimeCosts);
        
        const archives = newArchive ? [...loadedArchives, newArchive] : loadedArchives;
        setMonthlyArchives(archives.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        }));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Database initialization error:', error);
        // Fallback to defaults
        setServices(DEFAULT_SERVICES);
        setFixedCosts(DEFAULT_FIXED_COSTS);
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, [checkMonthlyClose]);

  // Manual monthly close
  const performMonthlyClose = useCallback(async () => {
    if (!db || orders.length === 0) return;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Get current month's orders
    const monthOrders = orders.filter(o => {
      const d = new Date(o.timestamp);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    if (monthOrders.length === 0) return;

    const revenue = monthOrders.reduce((s, o) => s + o.price, 0);
    const materialCostsTotal = monthOrders.reduce((s, o) => s + o.materialCost, 0);
    const fixedTotal = fixedCosts.reduce((s, c) => s + c.amount, 0);
    const oneTimeTotal = oneTimeCosts.reduce((s, c) => s + c.amount, 0);
    const netProfit = revenue - materialCostsTotal - fixedTotal - oneTimeTotal;

    const archive: MonthlyArchive = {
      id: Date.now().toString(),
      year,
      month: month + 1,
      label: `${CZECH_MONTHS[month]} ${year}`,
      revenue,
      materialCosts: materialCostsTotal,
      fixedCosts: fixedTotal,
      oneTimeCosts: oneTimeTotal,
      netProfit,
      ordersCount: monthOrders.length,
      closedAt: new Date().toISOString(),
    };

    try {
      // Save archive to SQLite
      await db.runAsync(
        `INSERT INTO monthly_archive VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [archive.id, archive.year, archive.month, archive.label,
         archive.revenue, archive.materialCosts, archive.fixedCosts,
         archive.oneTimeCosts, archive.netProfit, archive.ordersCount,
         archive.closedAt]
      );

      // Clear orders for closed month
      if (monthOrders.length > 0) {
        const placeholders = monthOrders.map(() => '?').join(',');
        await db.runAsync(`DELETE FROM orders WHERE id IN (${placeholders})`,
          monthOrders.map(o => o.id));
      }

      // Clear one-time costs
      await db.runAsync(`DELETE FROM one_time_costs`);

      // Update state
      setOrders(prev => prev.filter(o => {
        const d = new Date(o.timestamp);
        return !(d.getMonth() === month && d.getFullYear() === year);
      }));
      setOneTimeCosts([]);
      setMonthlyArchives(prev => [archive, ...prev]);
    } catch (error) {
      console.error('Error performing monthly close:', error);
    }
  }, [db, orders, fixedCosts, oneTimeCosts]);

  // Service operations
  const addService = useCallback(async (s: Omit<Service, 'id'>) => {
    const newService: Service = { ...s, id: Date.now().toString() };
    setServices(prev => [...prev, newService]);
    
    if (db) {
      try {
        await db.runAsync(
          'INSERT INTO services (id, name, price, materialCost) VALUES (?, ?, ?, ?)',
          [newService.id, newService.name, newService.price, newService.materialCost]
        );
      } catch (error) {
        console.error('Error adding service:', error);
      }
    }
  }, [db]);

  const updateService = useCallback(async (s: Service) => {
    setServices(prev => prev.map(x => x.id === s.id ? s : x));
    
    if (db) {
      try {
        await db.runAsync(
          'UPDATE services SET name = ?, price = ?, materialCost = ? WHERE id = ?',
          [s.name, s.price, s.materialCost, s.id]
        );
      } catch (error) {
        console.error('Error updating service:', error);
      }
    }
  }, [db]);

  const deleteService = useCallback(async (id: string) => {
    setServices(prev => prev.filter(x => x.id !== id));
    
    if (db) {
      try {
        await db.runAsync('DELETE FROM services WHERE id = ?', [id]);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  }, [db]);

  // Order operations
  const addOrder = useCallback(async (o: Omit<Order, 'id' | 'timestamp'>) => {
    const newOrder: Order = { 
      ...o, 
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setOrders(prev => [...prev, newOrder]);
    
    if (db) {
      try {
        await db.runAsync(
          'INSERT INTO orders (id, serviceName, price, materialCost, timestamp) VALUES (?, ?, ?, ?, ?)',
          [newOrder.id, newOrder.serviceName, newOrder.price, newOrder.materialCost, newOrder.timestamp]
        );
      } catch (error) {
        console.error('Error adding order:', error);
      }
    }
  }, [db]);

  // Fixed cost operations
  const addFixedCost = useCallback(async (c: Omit<FixedCost, 'id'>) => {
    const newCost: FixedCost = { ...c, id: Date.now().toString() };
    setFixedCosts(prev => [...prev, newCost]);
    
    if (db) {
      try {
        await db.runAsync(
          'INSERT INTO fixed_costs (id, name, amount) VALUES (?, ?, ?)',
          [newCost.id, newCost.name, newCost.amount]
        );
      } catch (error) {
        console.error('Error adding fixed cost:', error);
      }
    }
  }, [db]);

  const updateFixedCost = useCallback(async (c: FixedCost) => {
    setFixedCosts(prev => prev.map(x => x.id === c.id ? c : x));
    
    if (db) {
      try {
        await db.runAsync(
          'UPDATE fixed_costs SET name = ?, amount = ? WHERE id = ?',
          [c.name, c.amount, c.id]
        );
      } catch (error) {
        console.error('Error updating fixed cost:', error);
      }
    }
  }, [db]);

  const deleteFixedCost = useCallback(async (id: string) => {
    setFixedCosts(prev => prev.filter(x => x.id !== id));
    
    if (db) {
      try {
        await db.runAsync('DELETE FROM fixed_costs WHERE id = ?', [id]);
      } catch (error) {
        console.error('Error deleting fixed cost:', error);
      }
    }
  }, [db]);

  // One-time cost operations
  const addOneTimeCost = useCallback(async (c: Omit<OneTimeCost, 'id' | 'date'>) => {
    const newCost: OneTimeCost = { 
      ...c, 
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    setOneTimeCosts(prev => [...prev, newCost]);
    
    if (db) {
      try {
        await db.runAsync(
          'INSERT INTO one_time_costs (id, name, amount, date) VALUES (?, ?, ?, ?)',
          [newCost.id, newCost.name, newCost.amount, newCost.date]
        );
      } catch (error) {
        console.error('Error adding one-time cost:', error);
      }
    }
  }, [db]);

  const deleteOneTimeCost = useCallback(async (id: string) => {
    setOneTimeCosts(prev => prev.filter(x => x.id !== id));
    
    if (db) {
      try {
        await db.runAsync('DELETE FROM one_time_costs WHERE id = ?', [id]);
      } catch (error) {
        console.error('Error deleting one-time cost:', error);
      }
    }
  }, [db]);

  return (
    <AppContext.Provider value={{
      services,
      orders,
      fixedCosts,
      oneTimeCosts,
      monthlyArchives,
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
      performMonthlyClose,
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
