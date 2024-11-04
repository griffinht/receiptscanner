const TransactionsTable = (data) => {
  const transactions = Object.entries(data).flatMap(([month, categories]) => 
    Object.entries(categories).flatMap(([category, data]) =>
      data.transactions.map(transaction => ({
        ...transaction,
        category
      }))
    )
  );

  if (transactions.length === 0) {
    return '<p>No transactions found.</p>';
  }

  return `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Store</th>
            <th>Category</th>
            <th>Item</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(transaction => `
            <tr>
              <td>
                <a href="/receipts/${transaction.receipt_id}" class="date-link">
                  ${new Date(transaction.date).toLocaleDateString()}
                </a>
              </td>
              <td>${transaction.store}</td>
              <td>
                <a href="/categories?category=${encodeURIComponent(transaction.category)}" class="category-link">
                  ${transaction.category}
                </a>
              </td>
              <td>
                <a href="/items?highlight=${transaction.item_id}" class="item-link">
                  ${transaction.item}
                </a>
              </td>
              <td class="text-right">$${transaction.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-right"><strong>Total:</strong></td>
            <td class="text-right">
              <strong>$${transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

module.exports = { TransactionsTable }; 