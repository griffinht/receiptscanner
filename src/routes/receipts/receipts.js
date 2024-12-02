const { html } = require('hono/html');
const { setOrdersForReceipt } = require('./util/ItemOrders');
const { registerRoutes: getRegisterRoutes } = require('./get');
const { register: itemsRegister } = require('./items/items')
const { register: register_new } = require('./new')

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
      <div>
        <p>Add new receipt:<a href="./new" class="button">+</a></p>
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
                <a href="${receipt.id}/" class="button">Edit</a>
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

const getReceipt = require('./get');

// Route registration
const registerRoutes = (app, wrapRoute, db) => {
  getRegisterRoutes(app, wrapRoute, db)
  register_new(app, db)
  itemsRegister(app, db)
  app.get('/', wrapRoute(receiptsRoute, 'receipts'));
 
  // Delete receipt
  app.post('/:id/delete', async (c) => {
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
    
    return c.redirect('../');
  });

  app.post('/:id/date', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const formData = await c.req.parseBody();
    const newDate = formData.date;

    await db.run(`
      UPDATE receipts 
      SET date = ? 
      WHERE id = ?
    `, [newDate, receiptId]);
    
    return c.redirect(`.`);
  });
  
  app.post('/:id/location', async (c) => {
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
    
    return c.redirect(`.`);
  });

  app.post('/:id/items', async (c) => {
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
    
    return c.redirect(`.`);
  });

  app.post('/:id/items/:itemId/delete', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const itemId = parseInt(c.req.param('itemId'));

    await db.run(`
      DELETE FROM receipt_items
      WHERE id = ? AND receipt_id = ?
    `, [itemId, receiptId]);
    
    return c.redirect(`../../`);
  });

  app.post('/:id/reorder', async (c) => {
    const receiptId = parseInt(c.req.param('id'));
    const { items } = await c.req.json();
    
    const orderMap = new Map();
    items.forEach(item => {
      orderMap.set(item.id.toString(), item.order);
    });
    
    await setOrdersForReceipt(db, receiptId, orderMap);
    
    // todo why do we do this?
    return c.json({ success: true });
  });

  // Add the new route for updating amounts
  app.post('/:id/items/:itemId/amount', async (c) => {
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
    
    return c.redirect(`../../?highlight=${itemId}`);
  });
};

module.exports = {
  registerRoutes
}; 