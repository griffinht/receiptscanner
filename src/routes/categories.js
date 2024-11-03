const { BaseHTML } = require('../templates/base');
const { BarChart: ChartSection } = require('../components/BarChart');
const { LineChart: LineChartSection } = require('../components/LineChart');
const { TransactionsTable } = require('../components/TransactionsTable');
const { mockSpendingData } = require('../data/mockData');

const getDisplayData = (category, item, mockSpendingData) => {
  if (!category) return mockSpendingData;

  if (item) {
    // Filter for specific item across all months
    return Object.entries(mockSpendingData).reduce((acc, [month, monthData]) => {
      if (monthData[category]) {
        const itemTransactions = monthData[category].transactions.filter(t => t.item === item);
        if (itemTransactions.length > 0) {
          acc[month] = {
            [category]: {
              transactions: itemTransactions,
              total: itemTransactions.reduce((sum, t) => sum + t.amount, 0),
              items: { [item]: itemTransactions.reduce((sum, t) => sum + t.amount, 0) }
            }
          };
        }
      }
      return acc;
    }, {});
  }

  // Get data for all months but only for the selected category
  return Object.entries(mockSpendingData).reduce((acc, [month, monthData]) => {
    if (monthData[category]) {
      const transactions = monthData[category].transactions;
      const itemTotals = transactions.reduce((acc, t) => {
        acc[t.item] = (acc[t.item] || 0) + t.amount;
        return acc;
      }, {});

      acc[month] = {
        [category]: {
          ...monthData[category],
          items: itemTotals
        }
      };
    }
    return acc;
  }, {});
};

const categoriesRoute = async (c) => {
  const category = c.req.query('category');
  const item = c.req.query('item');
  
  const displayData = getDisplayData(category, item, mockSpendingData);

  return {
    title: 'Categories',
    content: `
      <div class="container">
        <h1>Monthly Grocery Spending Breakdown</h1>
        ${category ? `
          <a href="/categories">Back to Categories</a>
          <h2>${item ? `${item} Purchases in ${category}` : `${category} Spending By Month`}</h2>
        ` : ''}
        ${ChartSection(displayData, category, item)}
        ${LineChartSection(displayData, category, item)}
        ${TransactionsTable(displayData)}
      </div>
    `
  };
};

module.exports = { categoriesRoute }; 