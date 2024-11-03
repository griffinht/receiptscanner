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
      item_id INTEGER NOT NULL,
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
  app.get('/', (c) => c.text('Hello Hoo!'))

  app.get('/api/users', (c) => {
    return c.json({
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]
    })
  })

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