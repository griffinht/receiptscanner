const { BaseHTML } = require('../templates/base');
const { ChartSection } = require('../components/ChartSection');
const { LineChartSection } = require('../components/LineChartSection');
const { TransactionsTable } = require('../components/TransactionsTable');
const { TransactionsModal } = require('../components/TransactionsModal');
const { mockSpendingData } = require('../data/mockData');

const transformDataByStore = (data) => {
  const storeData = {};
  
  // Iterate through all months
  Object.entries(data).forEach(([month, monthData]) => {
    storeData[month] = {};
    
    // Iterate through all categories in the month
    Object.values(monthData).forEach(categoryData => {
      // Group transactions by store
      categoryData.transactions.forEach(transaction => {
        const storeName = transaction.storeName;
        if (!storeName) return; // Skip if no store data
        
        if (!storeData[month][storeName]) {
          storeData[month][storeName] = {
            transactions: [],
            total: 0,
            items: {}
          };
        }
        
        storeData[month][storeName].transactions.push(transaction);
        storeData[month][storeName].total += transaction.amount;
        
        // Update items totals
        if (!storeData[month][storeName].items[transaction.item]) {
          storeData[month][storeName].items[transaction.item] = 0;
        }
        storeData[month][storeName].items[transaction.item] += transaction.amount;
      });
    });

    // Remove empty months
    if (Object.keys(storeData[month]).length === 0) {
      delete storeData[month];
    }
  });
  
  return storeData;
};

const storesRoute = async (c) => {
  const store = c.req.query('store');
  const item = c.req.query('item');
  
  let displayData = transformDataByStore(mockSpendingData);
  
  if (store) {
    if (item) {
      // Filter for specific item across all months for the selected store
      displayData = Object.entries(displayData).reduce((acc, [month, monthData]) => {
        if (monthData[store]) {
          const itemTransactions = monthData[store].transactions.filter(t => t.item === item);
          if (itemTransactions.length > 0) {
            acc[month] = {
              [store]: {
                transactions: itemTransactions,
                total: itemTransactions.reduce((sum, t) => sum + t.amount, 0),
                items: { [item]: itemTransactions.reduce((sum, t) => sum + t.amount, 0) }
              }
            };
          }
        }
        return acc;
      }, {});
    } else {
      // Get data for all months but only for the selected store
      displayData = Object.entries(displayData).reduce((acc, [month, monthData]) => {
        if (monthData[store]) {
          acc[month] = {
            [store]: monthData[store]
          };
        }
        return acc;
      }, {});
    }
  }

  // Debug logging
  console.log('Transformed Data:', JSON.stringify(displayData, null, 2));

  const content = `
    <div class="container">
      <h1>Store Spending Analysis</h1>
      ${store ? `
        <a href="/stores">Back to All Stores</a>
        <h2>${item ? `${item} Purchases at ${store}` : `${store} Spending By Month`}</h2>
      ` : ''}
      ${ChartSection(displayData, store, item)}
      ${LineChartSection(displayData, store, item)}
      ${TransactionsTable(displayData)}
      ${TransactionsModal()}
    </div>
  `;
  return c.html(BaseHTML('Stores', content, 'stores'));
};

module.exports = { storesRoute }; 