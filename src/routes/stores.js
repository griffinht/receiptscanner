const sqlite = require('better-sqlite3');
const db = sqlite('shopping.db');

const storesRoute = async (c) => {
  const stores = db.prepare(`
    SELECT 
      s.id,
      s.name,
      COUNT(DISTINCT l.id) as location_count,
      COUNT(DISTINCT r.id) as receipt_count,
      SUM(ri.amount) as total_spent
    FROM stores s
    LEFT JOIN locations l ON l.store_id = s.id
    LEFT JOIN receipts r ON r.location_id = l.id
    LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
    GROUP BY s.id
    ORDER BY s.name
  `).all();

  const content = `
    <div class="container">
      <h1>Stores</h1>
      <table class="transactions-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Locations</th>
            <th>Receipts</th>
            <th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
          ${stores.map(store => `
            <tr>
              <td><a href="/stores/${store.id}">${store.name}</a></td>
              <td>${store.location_count}</td>
              <td>${store.receipt_count}</td>
              <td>$${store.total_spent ? store.total_spent.toFixed(2) : '0.00'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return {
    title: 'Stores',
    content
  };
};

const storeRoute = async (c) => {
  const storeId = parseInt(c.req.param('id'));
  
  const store = db.prepare(`
    SELECT id, name
    FROM stores
    WHERE id = ?
  `).get(storeId);

  const locations = db.prepare(`
    SELECT 
      l.id,
      l.address,
      COUNT(DISTINCT r.id) as receipt_count,
      SUM(ri.amount) as total_spent
    FROM locations l
    LEFT JOIN receipts r ON r.location_id = l.id
    LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
    WHERE l.store_id = ?
    GROUP BY l.id
    ORDER BY l.address
  `).all(storeId);

  const content = `
    <div class="container">
      <h1>${store.name}</h1>
      
      <h2>Locations</h2>
      <table class="transactions-table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Receipts</th>
            <th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
          ${locations.map(loc => `
            <tr>
              <td>${loc.address}</td>
              <td>${loc.receipt_count}</td>
              <td>$${loc.total_spent ? loc.total_spent.toFixed(2) : '0.00'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="actions">
        <a href="/stores" class="button">Back to Stores</a>
      </div>
    </div>
  `;

  return {
    title: store.name,
    content
  };
};

module.exports = {
  storesRoute,
  storeRoute
}; 