const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

// Create the app
const app = new Hono()

// Initialize database
let db;
const initDB = async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Create stores table first
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Create locations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      address TEXT NOT NULL,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      UNIQUE(store_id, address)
    )
  `);

  // Create categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      UNIQUE(category, department)
    )
  `);

  // Create items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(name, category_id)
    )
  `);

  // Create receipts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TIMESTAMP NOT NULL,
      location_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id)
    )
  `);

  // Create transactions table with item reference
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      item_id INTEGER, -- can be null if not an item
      total_cost REAL NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);
}

// Initialize DB before starting server
initDB().then(() => {
  // Add middleware
  app.use('*', logger())

  // Add routes
  //app.get('/', (c) => c.text('Hello Hoo!'))

  app.get('/api/users', (c) => {
    return c.json({
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]
    })
  })

  // Add this route after your other routes
  app.get('/', async (c) => {
    const stores = await db.all('SELECT * FROM stores');
    const locations = await db.all(`
      SELECT l.id, s.name as store_name, l.address 
      FROM locations l
      JOIN stores s ON l.store_id = s.id
    `);
    const categories = await db.all('SELECT id, category, department FROM categories');
    const items = await db.all(`
      SELECT i.id, i.name, c.category, c.department
      FROM items i
      JOIN categories c ON i.category_id = c.id
      ORDER BY c.department, c.category, i.name
    `);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          table { 
            border-collapse: collapse; 
            margin: 20px 0;
            font-family: Arial, sans-serif;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f2f2f2; 
          }
          h2 {
            margin-top: 30px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <h2>Stores</h2>
        <table>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
          ${stores.map(store => `
            <tr>
              <td>${store.id}</td>
              <td>${store.name}</td>
            </tr>
          `).join('')}
        </table>

        <h2>Locations</h2>
        <table>
          <tr>
            <th>ID</th>
            <th>Store</th>
            <th>Address</th>
          </tr>
          ${locations.map(loc => `
            <tr>
              <td>${loc.id}</td>
              <td>${loc.store_name}</td>
              <td>${loc.address}</td>
            </tr>
          `).join('')}
        </table>

        <h2>Categories</h2>
        <table>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Department</th>
          </tr>
          ${categories.map(cat => `
            <tr>
              <td>${cat.id}</td>
              <td>${cat.category}</td>
              <td>${cat.department}</td>
            </tr>
          `).join('')}
        </table>

        <h2>Items</h2>
        <table>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Department</th>
          </tr>
          ${items.map(item => `
            <tr>
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>${item.department}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    return c.html(html);
  });

  // Start the server
  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})