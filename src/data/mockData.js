// Expanded mock data to include transactions
const mockSpendingData = {
  'January 2024': {
    'Produce': {
      total: 125.45,
      transactions: [
        { date: '2024-01-03', item: 'Organic Bananas', amount: 4.99 },
        { date: '2024-01-03', item: 'Fresh Spinach', amount: 3.99 },
        { date: '2024-01-10', item: 'Tomatoes', amount: 6.50 },
        { date: '2024-01-15', item: 'Mixed Berries', amount: 8.99 },
        { date: '2024-01-20', item: 'Avocados', amount: 5.99 }
      ]
    },
    'Dairy': {
      total: 85.30,
      transactions: [
        { date: '2024-01-03', item: 'Whole Milk', amount: 4.50 },
        { date: '2024-01-03', item: 'Greek Yogurt', amount: 5.99 },
        { date: '2024-01-15', item: 'Cheese Block', amount: 7.99 }
      ]
    },
    'Meat': {
      total: 156.75,
      transactions: [
        { date: '2024-01-05', item: 'Chicken Breast', amount: 12.99 },
        { date: '2024-01-12', item: 'Ground Beef', amount: 8.99 },
        { date: '2024-01-19', item: 'Salmon Fillet', amount: 15.99 }
      ]
    },
    'Pantry': {
      total: 98.45,
      transactions: [
        { date: '2024-01-03', item: 'Pasta', amount: 3.99 },
        { date: '2024-01-03', item: 'Canned Tomatoes', amount: 2.99 },
        { date: '2024-01-15', item: 'Rice', amount: 5.99 },
        { date: '2024-01-15', item: 'Cereal', amount: 4.99 }
      ]
    }
  },
  'December 2023': {
    'Produce': {
      total: 118.75,
      transactions: [
        { date: '2023-12-02', item: 'Apples', amount: 5.99 },
        { date: '2023-12-08', item: 'Carrots', amount: 3.50 },
        { date: '2023-12-15', item: 'Bell Peppers', amount: 4.99 },
        { date: '2023-12-22', item: 'Sweet Potatoes', amount: 6.99 }
      ]
    },
    'Dairy': {
      total: 92.50,
      transactions: [
        { date: '2023-12-02', item: 'Almond Milk', amount: 4.99 },
        { date: '2023-12-08', item: 'Cottage Cheese', amount: 4.50 },
        { date: '2023-12-15', item: 'Butter', amount: 5.99 },
        { date: '2023-12-22', item: 'Sour Cream', amount: 3.99 }
      ]
    },
    'Meat': {
      total: 142.99,
      transactions: [
        { date: '2023-12-02', item: 'Turkey Breast', amount: 14.99 },
        { date: '2023-12-15', item: 'Pork Chops', amount: 11.99 },
        { date: '2023-12-22', item: 'Ground Turkey', amount: 7.99 }
      ]
    },
    'Pantry': {
      total: 105.25,
      transactions: [
        { date: '2023-12-02', item: 'Flour', amount: 4.99 },
        { date: '2023-12-08', item: 'Sugar', amount: 3.99 },
        { date: '2023-12-15', item: 'Olive Oil', amount: 8.99 },
        { date: '2023-12-22', item: 'Bread', amount: 4.50 }
      ]
    }
  },
  'November 2023': {
    'Produce': {
      total: 132.80,
      transactions: [
        { date: '2023-11-05', item: 'Brussels Sprouts', amount: 4.99 },
        { date: '2023-11-12', item: 'Butternut Squash', amount: 5.99 },
        { date: '2023-11-19', item: 'Green Beans', amount: 3.99 },
        { date: '2023-11-26', item: 'Cranberries', amount: 4.50 }
      ]
    },
    'Dairy': {
      total: 78.95,
      transactions: [
        { date: '2023-11-05', item: 'Heavy Cream', amount: 4.99 },
        { date: '2023-11-12', item: 'Cream Cheese', amount: 3.99 },
        { date: '2023-11-19', item: 'Eggnog', amount: 4.99 },
        { date: '2023-11-26', item: 'Whipped Cream', amount: 3.50 }
      ]
    },
    'Meat': {
      total: 168.50,
      transactions: [
        { date: '2023-11-12', item: 'Thanksgiving Turkey', amount: 45.99 },
        { date: '2023-11-19', item: 'Ham', amount: 25.99 },
        { date: '2023-11-26', item: 'Bacon', amount: 7.99 }
      ]
    },
    'Pantry': {
      total: 115.30,
      transactions: [
        { date: '2023-11-05', item: 'Stuffing Mix', amount: 4.99 },
        { date: '2023-11-12', item: 'Cranberry Sauce', amount: 3.50 },
        { date: '2023-11-19', item: 'Pumpkin Pie Mix', amount: 5.99 },
        { date: '2023-11-26', item: 'Gravy Mix', amount: 2.99 }
      ]
    }
  }
};

module.exports = { mockSpendingData }; 