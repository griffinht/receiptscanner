const { html } = require('hono/html');

// List all receipts
const receiptsRoute = async (c, db) => {
  const receipts = await db.all(`
    SELECT 
      r.id,
      r.date,
      s.name as store_name,
      l.address as location,
      COALESCE(SUM(ri.amount), 0) as total
    FROM receipts r
    JOIN locations l ON r.location_id = l.id
    JOIN stores s ON l.store_id = s.id
    LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
    GROUP BY r.id, r.date, s.name, l.address
    ORDER BY r.date DESC
  `);

  const content = `
    <div class="container">
      <h1>All Receipts</h1>
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Store</th>
            <th>Location</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${receipts.map(receipt => `
            <tr>
              <td>${new Date(receipt.date).toLocaleDateString()}</td>
              <td>${receipt.store_name}</td>
              <td>${receipt.location}</td>
              <td class="text-right">$${receipt.total.toFixed(2)}</td>
              <td>
                <a href="/receipts/${receipt.id}" class="button">Edit</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return {
    title: 'All Receipts',
    content
  };
};

// Single receipt view/edit
const receiptRoute = async (c, db) => {
  const receiptId = parseInt(c.req.param('id'));
  
  const receipt = await db.get(`
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
  `, [receiptId]);

  if (!receipt) {
    return {
      title: 'Receipt Not Found',
      content: '<div class="container"><h1>Receipt not found</h1></div>'
    };
  }

  const items = await db.all(`
    SELECT 
      i.name as item_name,
      c.name as category_name,
      ri.amount
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    WHERE ri.receipt_id = ?
    ORDER BY c.name, i.name
  `, [receiptId]);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const content = `
    <div class="container">
      <div class="actions" style="margin-bottom: 20px;">
        <a href="/receipts" class="button">← All Receipts</a>
      </div>
      
      <h1>Receipt #${receiptId}</h1>
      <div class="receipt-details">
        <form method="POST" action="/receipts/${receiptId}/date">
          <p>
            <label for="date">Date:</label>
            <input type="date" name="date" id="date" value="${receipt.date}">
            <button type="submit" class="button">Update Date</button>
          </p>
        </form>

        <p>
          <label>Store:</label>
          <a href="/stores/${receipt.store_id}">${receipt.store_name}, ${receipt.address}</a>
        </p>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Item</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.category_name}</td>
              <td>${item.item_name}</td>
              <td class="text-right">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right"><strong>Total:</strong></td>
            <td class="text-right"><strong>$${total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return {
    title: `Receipt ${receiptId}`,
    content
  };
};

// Update handlers
const updateReceiptDate = async (c, db) => {
  const receiptId = parseInt(c.req.param('id'));
  const formData = await c.req.parseBody();
  const newDate = formData.date;

  await db.run(`
    UPDATE receipts 
    SET date = ? 
    WHERE id = ?
  `, [newDate, receiptId]);
};

const updateReceiptLocation = async (c, db) => {
  const receiptId = parseInt(c.req.param('id'));
  const formData = await c.req.parseBody();
  const newLocation = formData.location;

  await db.run(`
    UPDATE receipts 
    SET location_id = (
      SELECT id FROM locations 
      WHERE address = ?
    )
    WHERE id = ?
  `, [newLocation, receiptId]);
};

// Route registration
const registerRoutes = (app, wrapRoute) => {
  app.get('/receipts', wrapRoute(receiptsRoute, 'receipts'));
  app.get('/receipts/:id', wrapRoute(receiptRoute, 'receipt'));
  app.post('/receipts/:id/date', async (c, db) => {
    await updateReceiptDate(c, db);
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });
  app.post('/receipts/:id/location', async (c, db) => {
    await updateReceiptLocation(c, db);
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });
};

module.exports = {
  registerRoutes
}; 