async function monthlySpendingRoute(db) {
  const monthlySpending = await db.all(`
    WITH RECURSIVE months(date) AS (
      SELECT date('now', 'start of month', '-11 months')
      UNION ALL
      SELECT date(date, '+1 month')
      FROM months
      WHERE date < date('now', 'start of month')
    )
    SELECT 
      strftime('%Y-%m', months.date) as month,
      c.department,
      c.category,
      COALESCE(SUM(t.total_cost), 0) as total_spending
    FROM months
    CROSS JOIN categories c
    LEFT JOIN items i ON i.category_id = c.id
    LEFT JOIN transactions t ON t.item_id = i.id
    LEFT JOIN receipts r ON t.receipt_id = r.id
      AND strftime('%Y-%m', r.date) = strftime('%Y-%m', months.date)
    GROUP BY 
      strftime('%Y-%m', months.date),
      c.department,
      c.category
    ORDER BY 
      month DESC,
      c.department,
      c.category
  `);

  // Group data by month for the charts
  const spendingByMonth = {};
  monthlySpending.forEach(spend => {
    if (!spendingByMonth[spend.month]) {
      spendingByMonth[spend.month] = [];
    }
    spendingByMonth[spend.month].push({
      category: spend.category,
      spending: Number(spend.total_spending)
    });
  });

  // Debug log
  console.log('Sample spending data:', spendingByMonth[Object.keys(spendingByMonth)[0]]);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        table { 
          border-collapse: collapse; 
          margin: 20px 0;
          font-family: Arial, sans-serif;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background-color: #f2f2f2; 
        }
        h2 {
          margin-top: 30px;
          color: #333;
        }
        .money {
          text-align: right;
        }
        
        .charts-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 20px 0;
        }
        
        .chart-wrapper {
          width: 400px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <h2>Monthly Spending by Category</h2>
      
      <div class="charts-container">
        ${Object.entries(spendingByMonth).map(([month, data]) => `
          <div class="chart-wrapper">
            <canvas id="chart-${month}"></canvas>
          </div>
        `).join('')}
      </div>

      <table>
        <tr>
          <th>Month</th>
          <th>Department</th>
          <th>Category</th>
          <th>Total Spending</th>
        </tr>
        ${monthlySpending.map(spend => `
          <tr>
            <td>${spend.month}</td>
            <td>${spend.department}</td>
            <td>${spend.category}</td>
            <td class="money">$${spend.total_spending.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>

      <script>
        ${Object.entries(spendingByMonth).map(([month, data]) => `
          console.log('Chart data for ${month}:', ${JSON.stringify(data)}); // Debug log
          new Chart(document.getElementById('chart-${month}'), {
            type: 'pie',
            data: {
              labels: ${JSON.stringify(data.map(d => d.category))},
              datasets: [{
                data: ${JSON.stringify(data.map(d => d.spending))},
                backgroundColor: [
                  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                  '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                  '#9966FF', '#FF9F40'
                ]
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Spending for ' + ${JSON.stringify(month)}
                },
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        `).join('\n')}
      </script>
    </body>
    </html>
  `;

  return html;
}

module.exports = {
  monthlySpendingRoute
}; 