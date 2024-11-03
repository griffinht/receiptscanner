const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const { serveStatic } = require('@hono/node-server/serve-static')
const { ChartSection } = require('./components/ChartSection')
const { TransactionsTable } = require('./components/TransactionsTable')
const { TransactionsModal } = require('./components/TransactionsModal')
const { mockSpendingData } = require('./data/mockData')

const app = new Hono()
app.use('*', logger())

// Serve static files from /static directory
app.use('/*', serveStatic({ root: './static' }))

app.get('/', async (c) => {
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
          // Calculate item totals for this month's category
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt Scanner - Grocery Spending</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link rel="stylesheet" href="/css/main.css">
        <link rel="stylesheet" href="/css/charts.css">
        <link rel="stylesheet" href="/css/transactions.css">
        <link rel="stylesheet" href="/css/modal.css">
        <script src="/components/spending-chart.js"></script>
      </head>
      <body>
        <h1>Monthly Grocery Spending Breakdown</h1>
        ${category ? `
          <a href="/">Back to All Data</a>
          <h2>${item ? `${item} Purchases in ${category}` : `${category} Spending By Month`}</h2>
        ` : ''}
        ${ChartSection(displayData, category, item)}
        ${TransactionsTable(displayData)}
        ${TransactionsModal()}
      </body>
    </html>
  `;
  return c.html(html);
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})