const { BarChart } = require('../components/BarChart');
const { TransactionsTable } = require('../components/TransactionsTable');

const getDisplayData = async (db, category, item, startDate, endDate) => {
  // Base query with date filtering
  const query = `
    SELECT 
      strftime('%Y-%m', r.date) as month,
      c.name as category,
      i.name as item,
      ri.amount,
      r.date,
      r.id as receipt_id,
      s.name as store_name,
      l.address as location
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    JOIN receipts r ON ri.receipt_id = r.id
    JOIN locations l ON r.location_id = l.id
    JOIN stores s ON l.store_id = s.id
    WHERE 1=1
    ${startDate ? "AND r.date >= ?" : ""}
    ${endDate ? "AND r.date <= ?" : ""}
    ORDER BY r.date DESC
  `;

  const params = [
    ...(startDate ? [startDate] : []),
    ...(endDate ? [endDate] : [])
  ];

  const transactions = await db.all(query, params);
  
  // Transform into the expected format
  const displayData = transactions.reduce((acc, trans) => {
    const { month, category: cat, item: itemName, amount, store_name, location } = trans;
    
    // Filter based on category/item if specified
    if (category && category !== cat) return acc;
    if (item && item !== itemName) return acc;
    
    // Initialize month if it doesn't exist
    if (!acc[month]) acc[month] = {};
    if (!acc[month][cat]) {
      acc[month][cat] = {
        transactions: [],
        total: 0,
        items: {},
        stores: {}
      };
    }
    
    // Add transaction with store info
    acc[month][cat].transactions.push({
      date: trans.date,
      receipt_id: trans.receipt_id,
      item: itemName,
      amount: amount,
      store: store_name,
      location: location
    });
    
    // Update totals
    acc[month][cat].total += amount;
    acc[month][cat].items[itemName] = (acc[month][cat].items[itemName] || 0) + amount;
    
    // Track spending by store
    const storeKey = `${store_name} - ${location}`;
    acc[month][cat].stores[storeKey] = (acc[month][cat].stores[storeKey] || 0) + amount;
    
    return acc;
  }, {});

  return displayData;
};

const categoriesRoute = async (c, db) => {
  const category = c.req.query('category');
  const item = c.req.query('item');
  const startDate = c.req.query('start');
  const endDate = c.req.query('end');
  
  // Get categories and their total spending
  const categories = await db.all(`
    SELECT 
      c.name,
      SUM(ri.amount) as total
    FROM categories c
    JOIN items i ON i.category_id = c.id
    JOIN receipt_items ri ON ri.item_id = i.id
    GROUP BY c.name
    ORDER BY total DESC
  `);
  
  const displayData = await getDisplayData(db, category, item, startDate, endDate);

  // Calculate summary statistics
  const totalSpending = Object.values(displayData).reduce((total, month) => {
    return total + Object.values(month).reduce((monthTotal, cat) => monthTotal + cat.total, 0);
  }, 0);

  return {
    title: 'Categories',
    content: `
      <style>
        .date-link {
          color: #007bff;
          text-decoration: none;
        }
        .date-link:hover {
          text-decoration: underline;
        }
      </style>
      
      <div class="container">
        <h1>Monthly Grocery Spending Breakdown</h1>
        
        <div class="filters">
          <form class="filter-form" method="GET" action="/categories">
            <div class="filter-group">
              <label for="categorySelect">Category:</label>
              <select id="categorySelect" name="category">
                <option value="">All Categories</option>
                ${categories.map(cat => `
                  <option value="${cat.name}" ${category === cat.name ? 'selected' : ''}>
                    ${cat.name} ($${cat.total.toFixed(2)})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="filter-group">
              <label for="startDate">From:</label>
              <input type="date" id="startDate" name="start" value="${startDate || ''}">
              
              <label for="endDate">To:</label>
              <input type="date" id="endDate" name="end" value="${endDate || ''}">
            </div>

            <div class="filter-actions">
              <button type="submit" class="button">Apply Filters</button>
              <a href="/categories" class="button secondary">Clear Filters</a>
            </div>
          </form>
        </div>

        <div class="summary-stats">
          <div class="stat-card">
            <h3>Total Spending</h3>
            <p>$${totalSpending.toFixed(2)}</p>
          </div>
          ${category ? `
            <div class="stat-card">
              <h3>${category} Total</h3>
              <p>$${Object.values(displayData).reduce((total, month) => {
                return total + (month[category]?.total || 0);
              }, 0).toFixed(2)}</p>
            </div>
          ` : ''}
        </div>

        ${category ? `
          <h2>${item ? `${item} Purchases in ${category}` : `${category} Spending By Month`}</h2>
        ` : ''}
        
        <div class="charts-container">
          <pie-charts 
            data='${JSON.stringify(displayData)}'
            category="${category || ''}"
          ></pie-charts>
          
          ${BarChart(displayData, category, item)}
          
          <line-chart 
            data='${JSON.stringify(displayData)}'
            category="${category || ''}"
          ></line-chart>
        </div>
        
        ${TransactionsTable(displayData)}
      </div>
    `
  };
};

module.exports = { categoriesRoute };