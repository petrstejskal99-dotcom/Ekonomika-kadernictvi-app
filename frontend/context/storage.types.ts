export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  materialCost: number;
}

export interface Order {
  id: string;
  serviceName: string;
  price: number;
  materialCost: number;
  timestamp: number;
}

export interface FixedCost {
  id: string;
  name: string;
  monthlyAmount: number;
}

export interface OneTimeCost {
  id: string;
  name: string;
  amount: number;
  date: number;
}

export const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Dámský střih', defaultPrice: 450, materialCost: 20 },
  { id: '2', name: 'Dámský střih + foukaná', defaultPrice: 650, materialCost: 25 },
  { id: '3', name: 'Pánský střih', defaultPrice: 280, materialCost: 15 },
  { id: '4', name: 'Dětský střih (do 12 let)', defaultPrice: 220, materialCost: 10 },
  { id: '5', name: 'Mytí vlasů + foukaná', defaultPrice: 350, materialCost: 30 },
  { id: '6', name: 'Foukaná vlasů', defaultPrice: 280, materialCost: 20 },
  { id: '7', name: 'Blow dry (kartáčování)', defaultPrice: 320, materialCost: 20 },
  { id: '8', name: 'Styling + účes', defaultPrice: 400, materialCost: 30 },
  { id: '9', name: 'Barvení celých vlasů', defaultPrice: 900, materialCost: 150 },
  { id: '10', name: 'Barvení celých vlasů + střih + foukaná', defaultPrice: 1400, materialCost: 170 },
  { id: '11', name: 'Dobarvení odrostů', defaultPrice: 650, materialCost: 100 },
  { id: '12', name: 'Dobarvení odrostů + střih + foukaná', defaultPrice: 1100, materialCost: 120 },
  { id: '13', name: 'Přeliv celých vlasů', defaultPrice: 750, materialCost: 120 },
  { id: '14', name: 'Zesvětlení vlasů (blonding)', defaultPrice: 1200, materialCost: 200 },
  { id: '15', name: 'Stahování barvy (stripping)', defaultPrice: 800, materialCost: 180 },
  { id: '16', name: 'Melír klasický', defaultPrice: 1200, materialCost: 250 },
  { id: '17', name: 'Balayage', defaultPrice: 1800, materialCost: 350 },
  { id: '18', name: 'Ombre', defaultPrice: 1600, materialCost: 300 },
  { id: '19', name: 'Air touch', defaultPrice: 2200, materialCost: 400 },
  { id: '20', name: 'Hair tattoo (holení vzoru)', defaultPrice: 350, materialCost: 20 },
  { id: '21', name: 'Keratinová péče', defaultPrice: 1500, materialCost: 400 },
  { id: '22', name: 'Laminace vlasů', defaultPrice: 1200, materialCost: 350 },
  { id: '23', name: 'Narovnávání vlasů', defaultPrice: 1800, materialCost: 450 },
  { id: '24', name: 'Trvalá ondulace', defaultPrice: 900, materialCost: 200 },
  { id: '25', name: 'Vlasová kúra (maska)', defaultPrice: 350, materialCost: 80 },
  { id: '26', name: 'Malibu C (odmineral.)', defaultPrice: 600, materialCost: 150 },
  { id: '27', name: 'Vlasová ozónoterapie', defaultPrice: 700, materialCost: 100 },
  { id: '28', name: 'Head spa', defaultPrice: 800, materialCost: 120 },
  { id: '29', name: 'Masáž hlavy', defaultPrice: 300, materialCost: 20 },
  { id: '30', name: 'Diagnostika vlasů', defaultPrice: 200, materialCost: 10 },
  { id: '31', name: 'Konzultace', defaultPrice: 0, materialCost: 0 },
  { id: '32', name: 'Prodlužování vlasů (za pás)', defaultPrice: 3000, materialCost: 800 },
  { id: '33', name: 'Zaplétání vlasů', defaultPrice: 500, materialCost: 20 },
  { id: '34', name: 'Společenský účes', defaultPrice: 700, materialCost: 40 },
  { id: '35', name: 'Svatební účes', defaultPrice: 1500, materialCost: 60 },
  { id: '36', name: 'Zkouška účesu', defaultPrice: 1000, materialCost: 40 },
];

export const DEFAULT_FIXED_COSTS: FixedCost[] = [
  { id: '1', name: 'Nájem', monthlyAmount: 0 },
  { id: '2', name: 'Elektřina', monthlyAmount: 0 },
  { id: '3', name: 'Internet', monthlyAmount: 0 },
  { id: '4', name: 'Pojištění', monthlyAmount: 0 },
];

export const STORAGE_KEYS = {
  SERVICES: '@salon_services',
  ORDERS: '@salon_orders',
  FIXED_COSTS: '@salon_fixed_costs',
  ONE_TIME_COSTS: '@salon_one_time_costs',
};

export interface StorageAdapter {
  initialize: () => Promise<{
    services: Service[];
    orders: Order[];
    fixedCosts: FixedCost[];
    oneTimeCosts: OneTimeCost[];
  }>;
  addService: (service: Service) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  addFixedCost: (cost: FixedCost) => Promise<void>;
  updateFixedCost: (cost: FixedCost) => Promise<void>;
  deleteFixedCost: (id: string) => Promise<void>;
  addOneTimeCost: (cost: OneTimeCost) => Promise<void>;
  deleteOneTimeCost: (id: string) => Promise<void>;
}
