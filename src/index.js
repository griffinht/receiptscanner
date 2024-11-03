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

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          z-index: 1000;
        }

        .modal-content {
          position: relative;
          background-color: white;
          margin: 15% auto;
          padding: 20px;
          width: 70%;
          max-width: 600px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .close-button {
          position: absolute;
          right: 20px;
          top: 15px;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .transactions-table th,
        .transactions-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .transactions-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }

        .modal-title {
          margin-top: 0;
          color: #2c3e50;
        }

        .transactions-section {
          margin-top: 40px;
          background-color: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-title {
          color: #2c3e50;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }

        .all-transactions-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .all-transactions-table th,
        .all-transactions-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .all-transactions-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #2c3e50;
        }

        .all-transactions-table tr:hover {
          background-color: #f5f5f5;
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

      <div class="transactions-section">
        <h2 class="section-title">All Transactions</h2>
        <table class="all-transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Month</th>
              <th>Category</th>
              <th>Item</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(mockSpendingData).flatMap(([month, categories]) => 
              Object.entries(categories).flatMap(([category, data]) =>
                data.transactions.map(t => `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>${month}</td>
                    <td>${category}</td>
                    <td>${t.item}</td>
                    <td>$${t.amount.toFixed(2)}</td>
                  </tr>
                `).join('')
              )
            ).join('')}
          </tbody>
        </table>
      </div>

      <div id="transactionsModal" class="modal">
        <div class="modal-content">
          <span class="close-button" onclick="closeModal()">&times;</span>
          <h2 class="modal-title" id="modalTitle"></h2>
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody id="transactionsBody">
            </tbody>
          </table>
        </div>
      </div>

      <script>
        const mockData = ${JSON.stringify(mockSpendingData)};
        const colors = [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#C9CBCF'
        ];

        function showTransactions(month, category) {
          const modal = document.getElementById('transactionsModal');
          const modalTitle = document.getElementById('modalTitle');
          const transactionsBody = document.getElementById('transactionsBody');
          
          const transactions = mockData[month][category].transactions;
          modalTitle.textContent = category + ' Transactions - ' + month;
          
          let html = '';
          transactions.forEach(t => {
            html += '<tr>' +
              '<td>' + new Date(t.date).toLocaleDateString() + '</td>' +
              '<td>' + t.item + '</td>' +
              '<td>$' + t.amount.toFixed(2) + '</td>' +
            '</tr>';
          });
          transactionsBody.innerHTML = html;
          
          modal.style.display = 'block';
        }

        function closeModal() {
          document.getElementById('transactionsModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
          const modal = document.getElementById('transactionsModal');
          if (event.target === modal) {
            modal.style.display = 'none';
          }
        }

        Object.entries(mockData).forEach(([month, data], index) => {
          const ctx = document.getElementById('chart' + index);
          new Chart(ctx, {
            type: 'pie',
            data: {
              labels: Object.keys(data),
              datasets: [{
                data: Object.values(data).map(cat => cat.total),
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
                      return label + ': $' + value.toFixed(2);
                    }
                  }
                }
              },
              onClick: (event, elements) => {
                if (elements.length > 0) {
                  const index = elements[0].index;
                  const category = Object.keys(data)[index];
                  showTransactions(month, category);
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