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

  // Get all stores/locations for the new receipt form
  const locations = await db.all(`
    SELECT 
      l.id,
      l.address,
      s.name as store_name
    FROM locations l
    JOIN stores s ON l.store_id = s.id
    ORDER BY s.name, l.address
  `);

  const content = `
    <div class="container">
      <h1>All Receipts</h1>

      <!-- New Receipt Form -->
      <div class="new-receipt-form">
        <h2>Add New Receipt</h2>
        <form method="POST" action="/receipts/new">
          <div class="form-group">
            <label for="date">Date:</label>
            <input type="date" id="date" name="date" required class="form-control" 
                   value="${new Date().toISOString().split('T')[0]}">
          </div>
          
          <div class="form-group">
            <label for="location">Store & Location:</label>
            <select name="location_id" required class="form-control">
              <option value="">Select store location...</option>
              ${locations.map(loc => `
                <option value="${loc.id}">${loc.store_name} - ${loc.address}</option>
              `).join('')}
            </select>
          </div>
          
          <button type="submit" class="button">Create Receipt</button>
        </form>
      </div>

      <h2>Recent Receipts</h2>
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
                <div class="button-group">
                  <a href="/receipts/${receipt.id}" class="button">Edit</a>
                  <form method="POST" action="/receipts/${receipt.id}/delete" style="display: inline;">
                    <button type="submit" class="button delete-button" 
                            onclick="return confirm('Are you sure you want to delete this receipt and all its items?')">
                      Delete
                    </button>
                  </form>
                </div>
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

  const availableItems = await db.all(`
    SELECT 
      i.id,
      i.name as item_name,
      c.name as category_name
    FROM items i
    JOIN categories c ON i.category_id = c.id
    ORDER BY c.name, i.name
  `);

  const items = await db.all(`
    SELECT 
      ri.id as receipt_item_id,
      i.id as item_id,
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

      <form method="POST" action="/receipts/${receiptId}/items" style="margin-bottom: 20px;">
        <div style="display: flex; gap: 10px; align-items: flex-end;">
          <div style="flex: 2;">
            <select name="item_id" required class="form-control">
              <option value="">Select an item...</option>
              ${availableItems.map(item => `
                <option value="${item.id}">${item.category_name} - ${item.item_name}</option>
              `).join('')}
            </select>
          </div>
          <div style="flex: 1;">
            <input type="number" name="amount" step="0.01" required class="form-control" placeholder="Amount">
          </div>
          <div>
            <button type="submit" class="button">Add Item</button>
          </div>
        </div>
      </form>

      <table class="table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Item</th>
            <th class="text-right">Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.category_name}</td>
              <td>${item.item_name}</td>
              <td class="text-right">$${item.amount.toFixed(2)}</td>
              <td>
                <form method="POST" action="/receipts/${receiptId}/items/${item.receipt_item_id}/delete" style="display: inline;">
                  <button type="submit" class="button" onclick="return confirm('Are you sure you want to delete this item?')">Delete</button>
                </form>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right"><strong>Total:</strong></td>
            <td class="text-right"><strong>$${total.toFixed(2)}</strong></td>
            <td></td>
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

// Route registration
const registerRoutes = (app, wrapRoute, db) => {
  app.get('/receipts', wrapRoute(receiptsRoute, 'receipts'));
  app.get('/receipts/:id', wrapRoute(receiptRoute, 'receipt'));
  
  // Add new receipt
  app.post('/receipts/new', async (c) => {
    const formData = await c.req.parseBody();
    const { date, location_id } = formData;

    // Validate inputs
    if (!date || !location_id) {
      throw new Error('Missing required fields');
    }

    const result = await db.run(`
      INSERT INTO receipts (date, location_id)
      VALUES (?, ?)
    `, [date, location_id]);
    
    return c.redirect(`/receipts/${result.lastID}`);
  });

  // Delete receipt
  app.post('/receipts/:id/delete', async (c) => {
    const receiptId = parseInt(c.req.param('id'));

    // First delete all receipt items
    await db.run(`
      DELETE FROM receipt_items
      WHERE receipt_id = ?
    `, [receiptId]);

    // Then delete the receipt
    await db.run(`
      DELETE FROM receipts
      WHERE id = ?
    `, [receiptId]);
    
    return c.redirect('/receipts');
  });

  app.post('/receipts/:id/date', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const formData = await c.req.parseBody();
    const newDate = formData.date;

    await db.run(`
      UPDATE receipts 
      SET date = ? 
      WHERE id = ?
    `, [newDate, receiptId]);
    
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });
  
  app.post('/receipts/:id/location', async (c) => {
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
    
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });

  app.post('/receipts/:id/items', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const formData = await c.req.parseBody();
    const itemId = parseInt(formData.item_id);
    const amount = parseFloat(formData.amount);

    // Validate inputs
    if (!receiptId || !itemId || isNaN(amount)) {
      throw new Error('Invalid input parameters');
    }

    await db.run(`
      INSERT INTO receipt_items (receipt_id, item_id, amount)
      VALUES (?, ?, ?)
    `, [receiptId, itemId, amount]);
    
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });

  app.post('/receipts/:id/items/:itemId/delete', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const itemId = parseInt(c.req.param('itemId'));

    await db.run(`
      DELETE FROM receipt_items
      WHERE id = ? AND receipt_id = ?
    `, [itemId, receiptId]);
    
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });
};

module.exports = {
  registerRoutes
}; 