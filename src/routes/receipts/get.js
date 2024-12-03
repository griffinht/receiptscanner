const { sortItemsByOrder } = require('./util/ItemOrders');
const { get: itemsGet, addItem } = require('./items/items');

const get = async (c, db) => {
  const receiptId = parseInt(c.req.param('id'));
  
  const receipt = await db.get(`
    SELECT 
      r.id,
      r.date,
      s.id as store_id,
      s.name as store_name,
      l.id as location_id,
      l.address
    FROM receipts r
    JOIN locations l ON r.location_id = l.id
    JOIN stores s ON l.store_id = s.id
    WHERE r.id = ?
  `, [receiptId]);

  if (!receipt) {
    return {
      title: 'Receipt Not Found',
      content: '<div class="container"><h1>Receipt not found</h1></div>'
    };
  }

  const availableItems = await db.all(`
    SELECT 
      i.id,
      i.name as item_name,
      c.name as category_name
    FROM items i
    JOIN categories c ON i.category_id = c.id
    ORDER BY c.name, i.name
  `);

  const items = await db.all(`
    SELECT 
        ri.id,
        i.id as item_id,
        i.name as item_name,
        c.name as category_name,
        ri.amount,
        ri.display_order
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE ri.receipt_id = ?
    ORDER BY ri.display_order, i.name
`, [receiptId]);

  // Use itemOrders to sort items
  const sortedItems = await sortItemsByOrder(db, receiptId);

  const total = sortedItems.reduce((sum, item) => sum + item.amount, 0);

  // Add this: Calculate category totals for the chart
  const categoryTotals = sortedItems.reduce((acc, item) => {
    acc[item.category_name] = (acc[item.category_name] || 0) + item.amount;
    return acc;
  }, {});

  const content = `
    <div class="container">
      <div class="actions" style="margin-bottom: 20px;">
        <div class="button-group">
          <a href="../" class="button">← All Receipts</a>
          <form method="POST" action="delete" style="display: inline;">
            <button type="submit" 
                    class="button delete-button" 
                    ${total > 0 ? 'disabled' : ''}
                    title="${total > 0 ? `Cannot delete: Receipt contains ${items.length} item${items.length === 1 ? '' : 's'}` : 'Delete this empty receipt'}"
                    onclick="return confirm('Delete this empty receipt?')">
              X
            </button>
          </form>
        </div>
      </div>
      
      <div style="display: flex;">
        <form method="POST" action="date">
          <p>
            <label for="date">Date:</label>
            <input type="date" name="date" id="date" value="${receipt.date}" onchange="this.form.submit()">
          </p>
        </form>

        <form method="POST" action="store">
          <p>
            <label>Store:</label>
            <p>todo update store</p>
            <a href="/stores/${receipt.store_id}">${receipt.store_name}, ${receipt.address}</a>
            <button type="submit" class="button">Update Store</button>
          </p>
        </form>
        
        <div class="receipt-image">
          <img src="${receiptId}.png" alt="Scanned Receipt" style="max-width: 100%; margin: 20px 0;">
        </div>
      4</div>

      <div class="receipt-header-sticky">
        <div class="receipt-total">
          Total: $${total.toFixed(2)}
        </div>
      </div>

      <div style="margin: 40px 0;">
        <h2>Spending Breakdown</h2>
        <div style="max-width: 600px; margin: auto;">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>

      ${await itemsGet(c, receiptId, db)}
      <table class="table" id="items-table">
        <thead>
          <tr>
            <th></th>
            <th>Category</th>
            <th>Item</th>
            <th class="text-right">Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="sortable-items">
          ${sortedItems.map(item => `
            <tr class="draggable-item ${item.id?.toString() === c.req.query('highlight') ? 'highlighted-row' : ''}" 
                data-id="${item.id}">
              <td class="drag-handle">☰</td>
              <td>
                <a href="/categories?category=${encodeURIComponent(item.category_name)}" class="category-link">
                  ${item.category_name || 'Uncategorized'}
                </a>
              </td>
              <td>
                <a href="/items?highlight=${item.item_id}" class="item-link">
                  ${item.item_name}
                </a>
              </td>
              <td class="text-right">
                <form method="POST" action="items/${item.id}/amount" style="display: inline;">
                  <input type="number" name="amount" value="${item.amount}" step="0.01" style="width: 100px;" class="form-control">
                  <button type="submit" class="button">Save</button>
                </form>
              </td>
              <td>
                <form method="POST" action="items/${item.id}/delete" style="display: inline;">
                  <button type="submit" class="button delete-button" 
                          onclick="return confirm('Are you sure you want to delete this item?')">Delete</button>
                </form>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right"><strong>Total:</strong></td>
            <td class="text-right"><strong>$${total.toFixed(2)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        // If there's a highlighted item, scroll to it
        const highlightedItem = document.querySelector('.highlighted-row');
        if (highlightedItem) {
          setTimeout(() => {
            highlightedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }

        new Sortable(document.getElementById('sortable-items'), {
          animation: 150,
          handle: '.drag-handle',
          onEnd: function(evt) {
            const items = [...evt.to.children].map((tr, index) => ({
              id: tr.dataset.id,
              order: index + 1
            }));

            fetch('/receipts/${receiptId}/reorder', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ items })
            });
          }
        });

        // Add this: Create the pie chart
        const ctx = document.getElementById('categoryChart');
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ${JSON.stringify(Object.keys(categoryTotals))},
            datasets: [{
              data: ${JSON.stringify(Object.values(categoryTotals))},
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#FF6384', '#C9CBCF', '#7BC8A4', '#E7E9ED'
              ]
            }]
          },
          options: {
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return \`\${context.label}: $\${value.toFixed(2)} (\${percentage}%)\`;
                  }
                }
              }
            }
          }
        });
      </script>
    </div>
  `;

  return {
    title: `Receipt ${receiptId}`,
    content
  };
};

const registerRoutes = (app, wrapRoute, db) => {
    app.get('/:id/', wrapRoute(get, 'receipts'));
}

module.exports = {
    registerRoutes
}