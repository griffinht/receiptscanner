const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const { serveStatic } = require('@hono/node-server/serve-static')
const { BaseHTML } = require('./templates/base')
const { categoriesRoute } = require('./routes/categories')
const { storesRoute, storeRoute } = require('./routes/stores')
const { registerRoutes } = require('./routes/receipts/receipts')
const { initDb } = require('./db')
const { registerRoutes: registerItemRoutes } = require('./routes/items')
const { registerRoutes: registerDebugRoutes } = require('./routes/debug')

const startServer = async () => {
  const app = new Hono()
  app.use('*', logger())


  // Initialize database
  const db = await initDb()

  // Serve static files from /static directory
  app.use('/*', serveStatic({ root: './static' }))

  // Middleware to wrap routes with BaseHTML
  const wrapRoute = (routeHandler, pageName) => {
    return async (c) => {
      const { title, content } = await routeHandler(c, db);
      return c.html(BaseHTML(title, content, pageName));
    };
  };

  // Redirect root to categories
  app.get('/', (c) => c.redirect('/categories'))
  
  app.get('/categories', wrapRoute(categoriesRoute, 'categories'))
  app.get('/stores', wrapRoute(storesRoute, 'stores'))
  app.get('/stores/:id', wrapRoute(storeRoute, 'store'))
  
  const receipts = new Hono()
  // Register receipt routes
  registerRoutes(receipts, wrapRoute, db);
  app.route('/receipts/', receipts)

  // Register item routes
  registerItemRoutes(app, wrapRoute, db);

  // Register debug routes
  registerDebugRoutes(app, wrapRoute, db);

  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

startServer().catch(console.error)