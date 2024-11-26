const { html } = require('hono/html');
const { setOrdersForReceipt, deleteOrdersForReceipt, itemOrders } = require('./receipts/itemOrders');

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
            <tr class="${receipt.id.toString() === c.req.query('highlight') ? 'highlighted-row' : ''}">
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

const getReceipt = require('./receipts/get');

// Route registration
const registerRoutes = (app, wrapRoute, db) => {
  app.get('/receipts', wrapRoute(receiptsRoute, 'receipts'));
  app.get('/receipts/:id', wrapRoute(getReceipt, 'receipts'));
  
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

    // Check if receipt has any items
    const itemCount = await db.get(`
      SELECT COUNT(*) as count
      FROM receipt_items
      WHERE receipt_id = ?
    `, [receiptId]);

    if (itemCount.count > 0) {
      throw new Error('Cannot delete receipt that has items');
    }

    await db.run(`
      DELETE FROM receipts
      WHERE id = ?
    `, [receiptId]);
    
    deleteOrdersForReceipt(receiptId);
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
    
    return c.redirect(`/receipts/${receiptId}`);
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
    
    // Update stored order after deletion
    const receiptKey = `receipt_${receiptId}`;
    if (itemOrders.has(receiptKey)) {
      const orderMap = itemOrders.get(receiptKey);
      orderMap.delete(itemId.toString());
      // If no items left, remove the entire receipt order
      if (orderMap.size === 0) {
        itemOrders.delete(receiptKey);
      }
    }
    
    return c.redirect(`/receipts/${c.req.param('id')}`);
  });

  app.post('/receipts/:id/reorder', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const { items } = await c.req.json();
    
    const orderMap = new Map();
    items.forEach(item => {
      orderMap.set(item.id.toString(), item.order);
    });
    
    setOrdersForReceipt(receiptId, orderMap);
    
    return c.json({ success: true });
  });

  // Add the new route for updating amounts
  app.post('/receipts/:id/items/:itemId/amount', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const itemId = parseInt(c.req.param('itemId'));
    const formData = await c.req.parseBody();
    const amount = parseFloat(formData.amount);

    // Validate inputs
    if (isNaN(amount) || amount < 0) {
      throw new Error('Invalid amount');
    }

    await db.run(`
      UPDATE receipt_items 
      SET amount = ? 
      WHERE id = ? AND receipt_id = ?
    `, [amount, itemId, receiptId]);
    
    return c.redirect(`/receipts/${receiptId}?highlight=${itemId}`);
  });
};

module.exports = {
  registerRoutes
}; 