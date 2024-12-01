const { html } = require('hono/html');

const register = (app, db) => {
    app.get('/receipts/:id/items/', async (c) => { return c.html(await get(c, parseInt(c.req.param('id')), db)) })
}

const get = async(c, receiptId, db) => {
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

    const content = `
        <div class="container">
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
                    ${items.map(item => `
                        <tr class="draggable-item ${item.id.toString() === c.req.query('highlight') ? 'highlighted-row' : ''}"
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
                                <form method="POST" action="/receipts/${receiptId}/items/${item.id}/amount" style="display: inline;">
                                    <input type="number" name="amount" value="${item.amount}" step="0.01" style="width: 100px;" class="form-control">
                                    <button type="submit" class="button">Save</button>
                                </form>
                            </td>
                            <td>
                                <form method="POST" action="/receipts/${receiptId}/items/${item.id}/delete" style="display: inline;">
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
                        <td class="text-right">
                            <strong>$${items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</strong>
                        </td>
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

    return content;
};

module.exports = {
    register,
    get
};