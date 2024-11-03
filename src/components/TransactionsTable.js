function TransactionsTable(data) {
  return `
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
          ${Object.entries(data).flatMap(([month, categories]) => 
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
  `;
}

module.exports = { TransactionsTable }; 