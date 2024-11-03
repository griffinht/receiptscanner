const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const { serveStatic } = require('@hono/node-server/serve-static')
const { homeRoute } = require('./routes/home')
const { categoriesRoute } = require('./routes/categories')
const { storesRoute } = require('./routes/stores')

const app = new Hono()
app.use('*', logger())

// Serve static files from /static directory
app.use('/*', serveStatic({ root: './static' }))

// Routes
app.get('/', homeRoute)
app.get('/categories', categoriesRoute)
app.get('/stores', storesRoute)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})