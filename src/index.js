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
        ${ChartSection(mockSpendingData)}
        ${TransactionsTable(mockSpendingData)}
        ${TransactionsModal()}
        
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

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})