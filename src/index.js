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
  
  let displayData = mockSpendingData;
  if (category) {
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt Scanner - Grocery Spending</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link rel="stylesheet" href="/main.css">
      </head>
      <body>
        <h1>Monthly Grocery Spending Breakdown</h1>
        ${category ? `
          <a href="/">Back to All Data</a>
          <h2>${category} Spending By Month</h2>
        ` : ''}
        ${ChartSection(displayData)}
        ${TransactionsTable(displayData)}
        ${TransactionsModal()}
        
        <script>
          const mockData = ${JSON.stringify(displayData)};
          const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#C9CBCF'
          ];

          Object.entries(mockData).forEach(([month, data], index) => {
            const ctx = document.getElementById('chart' + index);
            const isDetailView = ${Boolean(category)};
            
            new Chart(ctx, {
              type: 'pie',
              data: {
                labels: isDetailView ? 
                  Object.keys(data[Object.keys(data)[0]].items) : 
                  Object.keys(data),
                datasets: [{
                  data: isDetailView ? 
                    Object.values(data[Object.keys(data)[0]].items) : 
                    Object.values(data).map(cat => cat.total),
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
                onClick: isDetailView ? null : (event, elements) => {
                  if (elements.length > 0) {
                    const index = elements[0].index;
                    const category = Object.keys(data)[index];
                    window.location.href = \`?category=\${category}\`;
                  }
                }
              }
            });
          });

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
        </script>
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