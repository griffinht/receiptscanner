const { sortItemsByOrder } = require('./itemOrders');

// Single receipt view/edit
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
      ri.id as receipt_item_id,
      i.id as item_id,
      i.name as item_name,
      c.name as category_name,
      ri.amount,
      ri.id as display_order
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    WHERE ri.receipt_id = ?
  `, [receiptId]);

  // Use itemOrders to sort items
  const sortedItems = await sortItemsByOrder(db, receiptId);

  const total = sortedItems.reduce((sum, item) => sum + item.amount, 0);

  const content = `
    <div class="container">
      <div class="actions" style="margin-bottom: 20px;">
        <div class="button-group">
          <a href="/receipts" class="button">← All Receipts</a>
          <form method="POST" action="/receipts/${receiptId}/delete" style="display: inline;">
            <button type="submit" 
                    class="button delete-button" 
                    ${total > 0 ? 'disabled' : ''}
                    title="${total > 0 ? `Cannot delete: Receipt contains ${items.length} item${items.length === 1 ? '' : 's'}` : 'Delete this empty receipt'}"
                    onclick="return confirm('Delete this empty receipt?')">
              Delete Receipt
            </button>
          </form>
        </div>
      </div>
      
      <h1>Receipt #${receiptId}</h1>
      <div class="receipt-details">
        <form method="POST" action="/receipts/${receiptId}/date">
          <p>
            <label for="date">Date:</label>
            <input type="date" name="date" id="date" value="${receipt.date}">
            <button type="submit" class="button">Update Date</button>
          </p>
        </form>

        <p>
          <label>Store:</label>
          <a href="/stores/${receipt.store_id}">${receipt.store_name}, ${receipt.address}</a>
        </p>
        
        <div class="receipt-image">
          <img src="${receiptId}.png" alt="Scanned Receipt" style="max-width: 100%; margin: 20px 0;">
        </div>
      4</div>

      <form method="POST" action="/receipts/${receiptId}/items" style="margin-bottom: 20px;">
        <div style="display: flex; gap: 10px; align-items: flex-end;">
          <div style="flex: 2;">
            <select name="item_id" required class="form-control">
              <option value="">Select an item...</option>
              ${availableItems.map(item => `
                <option value="${item.id}">${item.category_name} - ${item.item_name}</option>
              `).join('')}
            </select>
          </div>
          <div style="flex: 1;">
            <input type="number" name="amount" step="0.01" required class="form-control" placeholder="Amount">
          </div>
          <div>
            <button type="submit" class="button">Add Item</button>
          </div>
        </div>
      </form>

      <div class="receipt-header-sticky">
        <div class="receipt-total">
          Total: $${total.toFixed(2)}
        </div>
      </div>

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
            <tr class="draggable-item ${item.receipt_item_id.toString() === c.req.query('highlight') ? 'highlighted-row' : ''}" 
                data-id="${item.receipt_item_id}">
              <td class="drag-handle">☰</td>
              <td>
                <a href="/categories?category=${encodeURIComponent(item.category_name)}" class="category-link">
                  ${item.category_name}
                </a>
              </td>
              <td>
                <a href="/items?highlight=${item.item_id}" class="item-link">
                  ${item.item_name}
                </a>
              </td>
              <td class="text-right">
                <form method="POST" action="/receipts/${receiptId}/items/${item.receipt_item_id}/amount" style="display: inline;">
                  <input type="number" name="amount" value="${item.amount}" step="0.01" style="width: 100px;" class="form-control">
                  <button type="submit" class="button">Save</button>
                </form>
              </td>
              <td>
                <form method="POST" action="/receipts/${receiptId}/items/${item.receipt_item_id}/delete" style="display: inline;">
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
      </script>
    </div>
  `;

  return {
    title: `Receipt ${receiptId}`,
    content
  };
};

const registerRoutes = (app, wrapRoute, db) => {
    app.get('/receipts/:id', wrapRoute(get, 'receipts'));
}

module.exports = {
    registerRoutes
}