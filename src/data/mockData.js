// Store definitions
const STORES = {
  // 2024 Stores
  FRESH_MARKET: { name: 'Fresh Market', address: '123 Main St, Anytown, USA' },
  SUPER_FOODS: { name: 'Super Foods', address: '456 Oak Ave, Anytown, USA' },
  GROCERY_HUB: { name: 'Grocery Hub', address: '789 Pine Rd, Anytown, USA' },
  FARMERS_CHOICE: { name: 'Farmers Choice', address: '135 Maple St, Anytown, USA' },
  // 2023 Stores
  HOLIDAY_FRESH: { name: 'Holiday Fresh', address: '321 Elm St, Anytown, USA' },
  WINTER_GREENS: { name: 'Winter Greens', address: '654 Spruce Ave, Anytown, USA' },
  SEASONAL_MARKET: { name: 'Seasonal Market', address: '987 Cedar Rd, Anytown, USA' }
};

// Helper functions
const createTransaction = (date, item, amount, store) => ({
  date,
  item,
  amount,
  storeName: store.name,
  storeAddress: store.address
});

const createDayTransactions = (date, store, items) => 
  items.map(([item, amount]) => createTransaction(date, item, amount, store));

// January 2024 Data
const january2024 = {
  'Produce': {
    total: 245.82,
    transactions: [
      ...createDayTransactions('2024-01-03', STORES.FRESH_MARKET, [
        ['Bananas', 4.99],
        ['Spinach', 3.99],
        ['Sweet Potatoes', 4.50]
      ]),
      ...createDayTransactions('2024-01-10', STORES.SUPER_FOODS, [
        ['Bananas', 5.25],
        ['Tomatoes', 6.50],
        ['Baby Carrots', 3.99]
      ]),
      ...createDayTransactions('2024-01-15', STORES.GROCERY_HUB, [
        ['Mixed Berries', 8.99],
        ['Bananas', 4.75],
        ['Kale', 3.50]
      ]),
      ...createDayTransactions('2024-01-20', STORES.FARMERS_CHOICE, [
        ['Avocados', 5.99],
        ['Bananas', 5.00],
        ['Zucchini', 2.99]
      ])
    ]
  },
  'Dairy': {
    total: 95.30,
    transactions: [
      ...createDayTransactions('2024-01-03', STORES.FRESH_MARKET, [
        ['Whole Milk', 4.50],
        ['Greek Yogurt', 5.99]
      ]),
      ...createDayTransactions('2024-01-10', STORES.SUPER_FOODS, [
        ['Whole Milk', 4.75],
        ['Greek Yogurt', 6.25],
        ['Cheese Slices', 3.99]
      ]),
      ...createDayTransactions('2024-01-15', STORES.GROCERY_HUB, [
        ['Cheese Block', 7.99],
        ['Almond Milk', 4.99]
      ]),
      ...createDayTransactions('2024-01-20', STORES.FARMERS_CHOICE, [
        ['Sour Cream', 3.99],
        ['Greek Yogurt', 6.00]
      ])
    ]
  },
  'Meat': {
    total: 175.50,
    transactions: [
      ...createDayTransactions('2024-01-05', STORES.FRESH_MARKET, [
        ['Chicken Breast', 12.99],
        ['Ground Beef', 8.99]
      ]),
      ...createDayTransactions('2024-01-12', STORES.SUPER_FOODS, [
        ['Chicken Thighs', 10.99],
        ['Ground Beef', 9.50],
        ['Salmon Fillet', 15.99]
      ]),
      ...createDayTransactions('2024-01-19', STORES.GROCERY_HUB, [
        ['Salmon Fillet', 16.50],
        ['Pork Chops', 11.99]
      ])
    ]
  },
  'Pantry': {
    total: 120.45,
    transactions: [
      ...createDayTransactions('2024-01-03', STORES.FRESH_MARKET, [
        ['Pasta', 3.99],
        ['Canned Tomatoes', 2.99]
      ]),
      ...createDayTransactions('2024-01-10', STORES.SUPER_FOODS, [
        ['Rice', 5.99],
        ['Cereal', 4.99]
      ]),
      ...createDayTransactions('2024-01-15', STORES.GROCERY_HUB, [
        ['Olive Oil', 8.99],
        ['Sugar', 3.99]
      ]),
      ...createDayTransactions('2024-01-20', STORES.FARMERS_CHOICE, [
        ['Flour', 4.99],
        ['Bread', 4.50]
      ])
    ]
  }
};

// December 2023 Data
const december2023 = {
  'Produce': {
    total: 118.75,
    transactions: [
      ...createDayTransactions('2023-12-02', STORES.HOLIDAY_FRESH, [
        ['Apples', 5.99],
        ['Carrots', 3.50]
      ]),
      ...createDayTransactions('2023-12-08', STORES.WINTER_GREENS, [
        ['Bell Peppers', 4.99]
      ]),
      ...createDayTransactions('2023-12-22', STORES.SEASONAL_MARKET, [
        ['Sweet Potatoes', 6.99]
      ])
    ]
  },
  'Dairy': {
    total: 92.50,
    transactions: [
      ...createDayTransactions('2023-12-02', STORES.HOLIDAY_FRESH, [
        ['Almond Milk', 4.99],
        ['Cottage Cheese', 4.50]
      ]),
      ...createDayTransactions('2023-12-15', STORES.WINTER_GREENS, [
        ['Butter', 5.99]
      ]),
      ...createDayTransactions('2023-12-22', STORES.SEASONAL_MARKET, [
        ['Sour Cream', 3.99]
      ])
    ]
  },
  'Meat': {
    total: 142.99,
    transactions: [
      ...createDayTransactions('2023-12-02', STORES.HOLIDAY_FRESH, [
        ['Turkey Breast', 14.99]
      ]),
      ...createDayTransactions('2023-12-15', STORES.WINTER_GREENS, [
        ['Pork Chops', 11.99]
      ]),
      ...createDayTransactions('2023-12-22', STORES.SEASONAL_MARKET, [
        ['Ground Turkey', 7.99]
      ])
    ]
  },
  'Pantry': {
    total: 105.25,
    transactions: [
      ...createDayTransactions('2023-12-02', STORES.HOLIDAY_FRESH, [
        ['Flour', 4.99],
        ['Sugar', 3.99]
      ]),
      ...createDayTransactions('2023-12-15', STORES.WINTER_GREENS, [
        ['Olive Oil', 8.99]
      ]),
      ...createDayTransactions('2023-12-22', STORES.SEASONAL_MARKET, [
        ['Bread', 4.50]
      ])
    ]
  }
};

// November 2023 Data
const november2023 = {
  'Produce': {
    total: 132.80,
    transactions: [
      ...createDayTransactions('2023-11-05', STORES.HOLIDAY_FRESH, [
        ['Brussels Sprouts', 4.99],
        ['Butternut Squash', 5.99]
      ]),
      ...createDayTransactions('2023-11-19', STORES.WINTER_GREENS, [
        ['Green Beans', 3.99],
        ['Cranberries', 4.50]
      ])
    ]
  },
  'Dairy': {
    total: 78.95,
    transactions: [
      ...createDayTransactions('2023-11-05', STORES.HOLIDAY_FRESH, [
        ['Heavy Cream', 4.99],
        ['Cream Cheese', 3.99]
      ]),
      ...createDayTransactions('2023-11-19', STORES.WINTER_GREENS, [
        ['Eggnog', 4.99],
        ['Whipped Cream', 3.50]
      ])
    ]
  },
  'Meat': {
    total: 168.50,
    transactions: [
      ...createDayTransactions('2023-11-12', STORES.HOLIDAY_FRESH, [
        ['Thanksgiving Turkey', 45.99]
      ]),
      ...createDayTransactions('2023-11-19', STORES.WINTER_GREENS, [
        ['Ham', 25.99],
        ['Bacon', 7.99]
      ])
    ]
  },
  'Pantry': {
    total: 115.30,
    transactions: [
      ...createDayTransactions('2023-11-05', STORES.HOLIDAY_FRESH, [
        ['Stuffing Mix', 4.99],
        ['Cranberry Sauce', 3.50]
      ]),
      ...createDayTransactions('2023-11-19', STORES.WINTER_GREENS, [
        ['Pumpkin Pie Mix', 5.99],
        ['Gravy Mix', 2.99]
      ])
    ]
  }
};

const mockSpendingData = {
  'January 2024': january2024,
  'December 2023': december2023,
  'November 2023': november2023
};

module.exports = {
  mockSpendingData,
  STORES,
  createTransaction,
  createDayTransactions
}; 