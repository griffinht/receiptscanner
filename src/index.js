const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const { monthlySpendingRoute } = require('./routes/monthlySpending')

// Create the app
const app = new Hono()

// Add middleware
app.use('*', logger())

// Add routes
app.get('/api/users', (c) => {
  return c.json({
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
  })
})

// Mock data for grocery spending categories
const mockSpendingData = {
  'January 2024': {
    'Produce': 125.45,
    'Dairy': 85.30,
    'Meat & Seafood': 165.90,
    'Pantry Items': 95.20,
    'Snacks': 45.75,
    'Beverages': 55.40,
    'Bakery': 35.25
  },
  'February 2024': {
    'Produce': 138.60,
    'Dairy': 92.40,
    'Meat & Seafood': 145.75,
    'Pantry Items': 88.90,
    'Snacks': 52.30,
    'Beverages': 48.95,
    'Bakery': 42.15
  },
  'March 2024': {
    'Produce': 132.80,
    'Dairy': 88.95,
    'Meat & Seafood': 158.40,
    'Pantry Items': 92.65,
    'Snacks': 48.90,
    'Beverages': 52.75,
    'Bakery': 38.80
  }
};

// Update home route
app.get('/', async (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt Scanner - Grocery Spending</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { 
          font-family: Arial, sans-serif;
          margin: 20px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        h1 { 
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
        }
        .charts-container {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          margin-top: 30px;
        }
        .chart-wrapper {
          width: 350px;
          margin: 20px;
          padding: 20px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chart-title {
          text-align: center;
          margin-bottom: 15px;
          font-weight: bold;
          color: #34495e;
          font-size: 1.2em;
        }
      </style>
    </head>
    <body>
      <h1>Monthly Grocery Spending Breakdown</h1>
      <div class="charts-container">
        ${Object.entries(mockSpendingData).map(([month, data], index) => `
          <div class="chart-wrapper">
            <div class="chart-title">${month}</div>
            <canvas id="chart${index}"></canvas>
          </div>
        `).join('')}
      </div>

      <script>
        const mockData = ${JSON.stringify(mockSpendingData)};
        const colors = [
          '#FF6384', // pink for produce
          '#36A2EB', // blue for dairy
          '#FFCE56', // yellow for meat
          '#4BC0C0', // teal for pantry
          '#9966FF', // purple for snacks
          '#FF9F40', // orange for beverages
          '#C9CBCF'  // gray for bakery
        ];

        Object.entries(mockData).forEach(([month, data], index) => {
          const ctx = document.getElementById('chart' + index);
          new Chart(ctx, {
            type: 'pie',
            data: {
              labels: Object.keys(data),
              datasets: [{
                data: Object.values(data),
                backgroundColor: colors,
                hoverOffset: 4
              }]
            },
            options: {
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      return \`\${label}: $\${value.toFixed(2)}\`;
                    }
                  }
                }
              }
            }
          });
        });
      </script>
    </body>
    </html>
  `;
  return c.html(html);
});

// Monthly spending route
app.get('/monthly-spending', async (c) => {
  return c.html(await monthlySpendingRoute());  // Note: removed db parameter
});

// Start the server
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})