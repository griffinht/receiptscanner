const { receipts, categories } = require('../data/mockData');

const homeRoute = async (c) => {
  // Create table rows for each receipt and its transactions
  const receiptRows = receipts.map((receipt, index) => {
    const total = receipt.transactions.reduce((sum, t) => sum + t.amount, 0);
    return `
      <tr class="receipt-header">
        <td colspan="3">
          <strong>Date: ${receipt.date}</strong>
          <a href="/receipts/${index}" class="edit-btn">Edit</a>
        </td>
        <td class="text-right"><strong>Total: $${total.toFixed(2)}</strong></td>
      </tr>
      ${receipt.transactions.map(trans => `
        <tr>
          <td></td>
          <td>${trans.item_id}</td>
          <td>Item #${trans.item_id}</td>
          <td class="text-right">$${trans.amount.toFixed(2)}</td>
        </tr>
      `).join('')}
    `;
  }).join('');

  const content = `
    <div class="container">
      <h1>Receipt History</h1>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th>Item ID</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${receiptRows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return {
    title: 'Home',
    content
  };
};

module.exports = {
  homeRoute
}; 