const { BaseHTML } = require('../templates/base');
const { ChartSection } = require('../components/ChartSection');
const { LineChartSection } = require('../components/LineChartSection');
const { TransactionsTable } = require('../components/TransactionsTable');
const { TransactionsModal } = require('../components/TransactionsModal');
const { mockSpendingData } = require('../data/mockData');

const categoriesRoute = async (c) => {
  const category = c.req.query('category');
  const item = c.req.query('item');
  
  let displayData = mockSpendingData;
  if (category) {
    if (item) {
      // Filter for specific item across all months
      displayData = Object.entries(mockSpendingData).reduce((acc, [month, monthData]) => {
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
    } else {
      // Get data for all months but only for the selected category
      displayData = Object.entries(mockSpendingData).reduce((acc, [month, monthData]) => {
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
    }
  }

  const content = `
    <div class="container">
      <h1>Monthly Grocery Spending Breakdown</h1>
      ${category ? `
        <a href="/categories">Back to Categories</a>
        <h2>${item ? `${item} Purchases in ${category}` : `${category} Spending By Month`}</h2>
      ` : ''}
      ${ChartSection(displayData, category, item)}
      ${LineChartSection(displayData, category, item)}
      ${TransactionsTable(displayData)}
      ${TransactionsModal()}
    </div>
  `;
  return c.html(BaseHTML('Categories', content, 'categories'));
};

module.exports = { categoriesRoute }; 