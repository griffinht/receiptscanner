const { BarChart } = require('../components/BarChart');
const { TransactionsTable } = require('../components/TransactionsTable');

const getDisplayData = async (db, category, item) => {
  // Get all transactions grouped by category and month
  const query = `
    SELECT 
      strftime('%Y-%m', r.date) as month,
      c.name as category,
      i.name as item,
      ri.amount,
      r.date
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    JOIN receipts r ON ri.receipt_id = r.id
    ORDER BY r.date DESC
  `;

  const transactions = await db.all(query);
  
  // Transform into the expected format
  const displayData = transactions.reduce((acc, trans) => {
    const { month, category: cat, item: itemName, amount } = trans;
    
    // Filter based on category/item if specified
    if (category && category !== cat) return acc;
    if (item && item !== itemName) return acc;
    
    // Initialize month if it doesn't exist
    if (!acc[month]) acc[month] = {};
    if (!acc[month][cat]) {
      acc[month][cat] = {
        transactions: [],
        total: 0,
        items: {}
      };
    }
    
    // Add transaction
    acc[month][cat].transactions.push({
      date: trans.date,
      item: itemName,
      amount: amount
    });
    
    // Update totals
    acc[month][cat].total += amount;
    acc[month][cat].items[itemName] = (acc[month][cat].items[itemName] || 0) + amount;
    
    return acc;
  }, {});

  return displayData;
};

const categoriesRoute = async (c, db) => {
  const category = c.req.query('category');
  const item = c.req.query('item');
  
  // Get all categories for the dropdown
  const categories = await db.all(`
    SELECT DISTINCT name 
    FROM categories 
    ORDER BY name
  `);
  
  const displayData = await getDisplayData(db, category, item);

  return {
    title: 'Categories',
    content: `
      <div class="container">
        <h1>Monthly Grocery Spending Breakdown</h1>
        
        <div class="filters">
          <select id="categorySelect" onchange="window.location.href='/categories?category=' + this.value">
            <option value="">All Categories</option>
            ${categories.map(cat => `
              <option value="${cat.name}" ${category === cat.name ? 'selected' : ''}>
                ${cat.name}
              </option>
            `).join('')}
          </select>
          
          ${category ? `
            <a href="/categories" class="button">Clear Filter</a>
          ` : ''}
        </div>

        ${category ? `
          <h2>${item ? `${item} Purchases in ${category}` : `${category} Spending By Month`}</h2>
        ` : ''}
        
        <pie-charts 
          data='${JSON.stringify(displayData)}'
          category="${category || ''}"
        ></pie-charts>
        
        ${BarChart(displayData, category, item)}
        
        <line-chart 
          data='${JSON.stringify(displayData)}'
          category="${category || ''}"
        ></line-chart>
        
        ${TransactionsTable(displayData)}
      </div>
    `
  };
};

module.exports = { categoriesRoute };