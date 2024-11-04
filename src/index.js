const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const { serveStatic } = require('@hono/node-server/serve-static')
const { BaseHTML } = require('./templates/base')
const { homeRoute } = require('./routes/home')
const { categoriesRoute } = require('./routes/categories')
const { storesRoute, storeRoute } = require('./routes/stores')
const { receiptRoute, updateReceiptRoute, updateReceiptDate, updateReceiptLocation } = require('./routes/receipt')
const { receiptsRoute } = require('./routes/receipts')
const { initDb } = require('./data/data')

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

  // Routes
  app.get('/', wrapRoute(homeRoute, 'home'))
  app.get('/categories', wrapRoute(categoriesRoute, 'categories'))
  app.get('/stores', wrapRoute(storesRoute, 'stores'))
  app.get('/stores/:id', wrapRoute(storeRoute, 'store'))
  app.get('/receipts/:id', wrapRoute(receiptRoute, 'receipt'))
  app.post('/receipts/:id', async (c) => {
    await updateReceiptRoute(c, db);
    return c.redirect(`/receipts/${c.req.param('id')}`);
  })
  app.post('/receipts/:id/date', async (c) => {
    await updateReceiptDate(c, db);
    return c.redirect(`/receipts/${c.req.param('id')}`);
  })
  app.post('/receipts/:id/location', async (c) => {
    await updateReceiptLocation(c, db);
    return c.redirect(`/receipts/${c.req.param('id')}`);
  })
  app.get('/receipts', wrapRoute(receiptsRoute, 'receipts'))

  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

startServer().catch(console.error)