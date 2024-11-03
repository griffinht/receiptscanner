const { receipts, items } = require('../data/mockData');

const receiptRoute = async (c) => {
  const receiptId = parseInt(c.req.param('id'));
  const receipt = receipts[receiptId];
  
  if (!receipt) {
    return {
      title: 'Receipt Not Found',
      content: '<div class="container"><h1>Receipt not found</h1></div>'
    };
  }

  const total = receipt.transactions.reduce((sum, t) => sum + t.amount, 0);

  const content = `
    <div class="container">
      <h1>Edit Receipt</h1>
      <form class="edit-receipt-form" action="/receipts/${receiptId}" method="POST">
        <div class="form-group">
          <label>Date:</label>
          <input type="date" name="date" value="${receipt.date}" required>
        </div>
        
        <div class="form-group">
          <label>Location:</label>
          <input type="number" name="location" value="${receipt.location}" required>
        </div>

        <h2>Transactions</h2>
        <div class="transactions-list">
          ${receipt.transactions.map((trans, index) => `
            <div class="transaction-item">
              <div class="form-group">
                <label>Item:</label>
                <input type="number" name="transactions[${index}][item_id]" 
                       value="${trans.item_id}" required>
                <span class="item-name">${items[trans.item_id]?.name || 'Unknown Item'}</span>
              </div>
              <div class="form-group">
                <label>Amount:</label>
                <input type="number" name="transactions[${index}][amount]" 
                       value="${trans.amount}" step="0.01" required>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="form-group total">
          <strong>Total: $${total.toFixed(2)}</strong>
        </div>

        <div class="form-actions">
          <button type="submit">Save Changes</button>
          <a href="/" class="button">Cancel</a>
        </div>
      </form>
    </div>
  `;

  return {
    title: `Edit Receipt ${receiptId}`,
    content
  };
};

module.exports = {
  receiptRoute
}; 