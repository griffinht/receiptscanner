const itemsRoute = async (c, db) => {
  // Modify the items query to include receipt information
  const items = await db.all(`
    SELECT 
      i.id,
      i.name as item_name,
      c.id as category_id,
      c.name as category_name,
      COALESCE(
        (SELECT MAX(r.date) 
         FROM receipt_items ri 
         JOIN receipts r ON ri.receipt_id = r.id 
         WHERE ri.item_id = i.id
        ), 
        '2000-01-01'
      ) as last_used,
      (SELECT COUNT(*) 
       FROM receipt_items ri 
       WHERE ri.item_id = i.id
      ) as usage_count,
      GROUP_CONCAT(
        DISTINCT json_object(
          'receipt_id', r.id,
          'date', r.date,
          'store', s.name,
          'amount', ri.amount
        )
      ) as receipts
    FROM items i
    JOIN categories c ON i.category_id = c.id
    LEFT JOIN receipt_items ri ON ri.item_id = i.id
    LEFT JOIN receipts r ON ri.receipt_id = r.id
    LEFT JOIN locations l ON r.location_id = l.id
    LEFT JOIN stores s ON l.store_id = s.id
    GROUP BY i.id, i.name, c.id, c.name
    ORDER BY last_used DESC, c.name, i.name
  `);

  // Parse the receipt JSON strings
  const itemsWithReceipts = items.map(item => ({
    ...item,
    receipts: item.receipts ? item.receipts.split('},{').map(r => {
      try {
        // Clean up the string and parse it
        const cleaned = r
          .replace('[{', '{')
          .replace('}]', '}')
          .replace(/\\/g, '');
        return JSON.parse(cleaned);
      } catch (e) {
        return null;
      }
    }).filter(r => r) : []
  }));

  // Group items by category
  const itemsByCategory = itemsWithReceipts.reduce((acc, item) => {
    if (!acc[item.category_name]) {
      acc[item.category_name] = {
        id: item.category_id,
        items: [],
        lastModified: item.last_used
      };
    }
    acc[item.category_name].items.push(item);
    // Update category's last modified if this item is more recent
    if (item.last_used > acc[item.category_name].lastModified) {
      acc[item.category_name].lastModified = item.last_used;
    }
    return acc;
  }, {});

  // Convert to array and sort by last modified
  const sortedCategories = Object.entries(itemsByCategory)
    .map(([name, data]) => ({
      name,
      id: data.id,
      items: data.items,
      lastModified: data.lastModified
    }))
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

  // Get all categories for the dropdown
  const categories = await db.all(`
    SELECT id, name
    FROM categories
    ORDER BY name
  `);

  const content = `
    <div class="container">
      <h1>Manage Items</h1>

      <!-- Add New Item Form -->
      <div class="new-receipt-form">
        <h2>Add New Item</h2>
        <form method="POST" action="/items/new">
          <div class="form-group">
            <label for="name">Item Name:</label>
            <input type="text" id="name" name="name" required class="form-control">
          </div>
          
          <div class="form-group">
            <label for="category">Category:</label>
            <select name="category_id" required class="form-control">
              <option value="">Select category...</option>
              ${categories.map(cat => `
                <option value="${cat.id}">${cat.name}</option>
              `).join('')}
            </select>
          </div>
          
          <button type="submit" class="button">Add Item</button>
        </form>
      </div>

      <!-- Items List -->
      ${sortedCategories.map(category => `
        <div class="category-section">
          <h2>${category.name}</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${category.items
                .sort((a, b) => new Date(b.last_used) - new Date(a.last_used))
                .map(item => `
                <tr class="${c.req.query('highlight') && item.id.toString() === c.req.query('highlight') ? 'highlighted-row' : ''}" id="item-${item.id}">
                  <td>
                    <form method="POST" action="/items/${item.id}/edit" style="display: inline;">
                      <input type="text" name="name" value="${item.item_name}" class="form-control" style="width: auto; display: inline;">
                      <button type="submit" class="button">Save</button>
                    </form>
                  </td>
                  <td>
                    <form method="POST" action="/items/${item.id}/edit" style="display: inline;">
                      <select name="category_id" class="form-control" style="width: auto; display: inline;">
                        ${categories.map(cat => `
                          <option value="${cat.id}" ${cat.id === item.category_id ? 'selected' : ''}>
                            ${cat.name}
                          </option>
                        `).join('')}
                      </select>
                      <button type="submit" class="button">Save</button>
                    </form>
                  </td>
                  <td>
                    ${item.usage_count > 0 ? `
                      <div class="item-usage">
                        <button class="button delete-button" disabled>
                          Delete
                        </button>
                        <div class="receipt-list">
                          <p>Used in ${item.usage_count} receipt${item.usage_count === 1 ? '' : 's'}:</p>
                          <ul>
                            ${item.receipts.map(r => `
                              <li>
                                <a href="/receipts/${r.receipt_id}?highlight=${item.id}">
                                  ${new Date(r.date).toLocaleDateString()} - ${r.store} ($${parseFloat(r.amount).toFixed(2)})
                                </a>
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      </div>
                    ` : `
                      <form method="POST" action="/items/${item.id}/delete" style="display: inline;">
                        <button type="submit" class="button delete-button" 
                                onclick="return confirm('Are you sure you want to delete this item?')">
                          Delete
                        </button>
                      </form>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>

    <script>
      // If there's a highlighted item, scroll to it
      const highlightedItem = document.querySelector('.highlighted-row');
      if (highlightedItem) {
        setTimeout(() => {
          highlightedItem.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
    </script>
  `;

  return {
    title: 'Manage Items',
    content
  };
};

const registerRoutes = (app, wrapRoute, db) => {
  app.get('/items', wrapRoute(itemsRoute, 'items'));

  // Add new item
  app.post('/items/new', async (c) => {
    const formData = await c.req.parseBody();
    const { name, category_id } = formData;

    // Validate inputs
    if (!name || !category_id) {
      throw new Error('Missing required fields');
    }

    await db.run(`
      INSERT INTO items (name, category_id)
      VALUES (?, ?)
    `, [name, category_id]);
    
    return c.redirect('/items');
  });

  // Edit item
  app.post('/items/:id/edit', async (c) => {
    const itemId = parseInt(c.req.param('id'));
    const formData = await c.req.parseBody();
    const { name, category_id } = formData;

    if (!name && !category_id) {
      throw new Error('Name or category is required');
    }

    // Build the update query based on what was provided
    let query = 'UPDATE items SET ';
    const params = [];

    if (name) {
      query += 'name = ?';
      params.push(name);
    }

    if (category_id) {
      if (name) query += ', ';
      query += 'category_id = ?';
      params.push(category_id);
    }

    query += ' WHERE id = ?';
    params.push(itemId);

    await db.run(query, params);
    
    // Redirect back to items page with highlight parameter
    return c.redirect(`/items?highlight=${itemId}`);
  });

  // Delete item
  app.post('/items/:id/delete', async (c) => {
    const itemId = parseInt(c.req.param('id'));

    // First check if the item is used in any receipts
    const usageCount = await db.get(`
      SELECT COUNT(*) as count
      FROM receipt_items
      WHERE item_id = ?
    `, [itemId]);

    if (usageCount.count > 0) {
      throw new Error('Cannot delete item that is used in receipts');
    }

    await db.run(`
      DELETE FROM items
      WHERE id = ?
    `, [itemId]);
    
    return c.redirect('/items');
  });
};

module.exports = {
  registerRoutes
}; 