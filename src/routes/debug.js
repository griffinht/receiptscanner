const { sortItemsByOrder } = require('./receipts/util/ItemOrders');

const debugRoute = async (c, db) => {
  const receiptId = 5;
  const sortedItems = await sortItemsByOrder(db, receiptId);
  console.log(sortedItems);
  return c.json(sortedItems);
};

const registerRoutes = (app, wrapRoute, db) => {
  app.get('/debug', wrapRoute(debugRoute, 'debug'));
};

module.exports = {
  registerRoutes
};
