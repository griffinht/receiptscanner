const { Hono } = require('hono')
const { serve } = require('@hono/node-server')
const { logger } = require('hono/logger')
const { serveStatic } = require('@hono/node-server/serve-static')
const { BaseHTML } = require('./templates/base')
const { homeRoute } = require('./routes/home')
const { categoriesRoute } = require('./routes/categories')
const { storesRoute } = require('./routes/stores')

const app = new Hono()
app.use('*', logger())

// Serve static files from /static directory
app.use('/*', serveStatic({ root: './static' }))

// Middleware to wrap routes with BaseHTML
const wrapRoute = (routeHandler, pageName) => {
  return async (c) => {
    const { title, content } = await routeHandler(c);
    return c.html(BaseHTML(title, content, pageName));
  };
};

// Routes
app.get('/', wrapRoute(homeRoute, 'home'))
app.get('/categories', wrapRoute(categoriesRoute, 'categories'))
app.get('/stores', wrapRoute(storesRoute, 'stores'))

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})