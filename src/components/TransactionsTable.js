const TransactionsTable = (data) => {
  // Calculate total amount across all transactions
  const totalAmount = Object.values(data).reduce((monthTotal, categories) => 
    monthTotal + Object.values(categories).reduce((categoryTotal, { transactions }) =>
      categoryTotal + transactions.reduce((transTotal, t) => transTotal + t.amount, 0)
    , 0)
  , 0);

  const tableHtml = `
    <div class="transactions-section">
      <div class="total-amount">
        Total Amount: $${totalAmount.toFixed(2)}
      </div>
      <table class="all-transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Store</th>
            <th>Location</th>
            <th>Category</th>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(data).map(([month, categories]) => 
            Object.entries(categories).map(([category, { transactions }]) =>
              transactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td>${t.storeName}</td>
                  <td>${t.storeAddress}</td>
                  <td>${category}</td>
                  <td>${t.item}</td>
                  <td>$${t.amount.toFixed(2)}</td>
                </tr>
              `).join('')
            ).join('')
          ).join('')}
        </tbody>
      </table>
    </div>
  `;

  return tableHtml;
};

module.exports = { TransactionsTable }; 