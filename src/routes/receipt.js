const sqlite = require('better-sqlite3');
const db = sqlite('shopping.db');

const receiptRoute = async (c) => {
  const receiptId = parseInt(c.req.param('id'));
  
  const receipt = db.prepare(`
    SELECT 
      r.id,
      r.date,
      s.id as store_id,
      s.name as store_name,
      l.id as location_id,
      l.address
    FROM receipts r
    JOIN locations l ON r.location_id = l.id
    JOIN stores s ON l.store_id = s.id
    WHERE r.id = ?
  `).get(receiptId);

  if (!receipt) {
    return {
      title: 'Receipt Not Found',
      content: '<div class="container"><h1>Receipt not found</h1></div>'
    };
  }

  const items = db.prepare(`
    SELECT 
      i.name as item_name,
      c.name as category_name,
      ri.amount
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    WHERE ri.receipt_id = ?
    ORDER BY c.name, i.name
  `).all(receiptId);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const content = `
    <div class="container">
      <h1>Receipt #${receiptId}</h1>
      <div class="receipt-details">
        <form method="POST" action="/receipts/${receiptId}/date">
          <p>
            <label for="date">Date:</label>
            <input type="date" name="date" id="date" value="${receipt.date}">
            <button type="submit" class="button-small">Update Date</button>
          </p>
        </form>

        <p>
          <label>Store:</label>
          <a href="/stores/${receipt.store_id}">${receipt.store_name}, ${receipt.address}</a>
        </p>
      </div>

      <table class="transactions-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.category_name}</td>
              <td>${item.item_name}</td>
              <td>$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right"><strong>Total:</strong></td>
            <td><strong>$${total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div class="actions">
        <a href="/" class="button">Back to Home</a>
      </div>
    </div>
  `;

  return {
    title: `Receipt ${receiptId}`,
    content
  };
};

const updateReceiptDate = async (c) => {
  const receiptId = parseInt(c.req.param('id'));
  const formData = await c.req.parseBody();
  const newDate = formData.date;

  db.prepare(`
    UPDATE receipts 
    SET date = ? 
    WHERE id = ?
  `).run(newDate, receiptId);
};

const updateReceiptLocation = async (c) => {
  const receiptId = parseInt(c.req.param('id'));
  const formData = await c.req.parseBody();
  const newLocation = formData.location;

  db.prepare(`
    UPDATE receipts 
    SET location_id = (
      SELECT id FROM locations 
      WHERE address = ?
    )
    WHERE id = ?
  `).run(newLocation, receiptId);
};

module.exports = {
  receiptRoute,
  updateReceiptDate,
  updateReceiptLocation
}; 