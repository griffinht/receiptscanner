const post = async (c, db) => {
    const receiptId = parseInt(c.req.param('id'));
    const formData = await c.req.parseBody();
    let itemId = parseInt(formData.item_id);
    const itemName = formData.item_name;
    const amount = parseFloat(formData.amount);

    // Validate inputs
    if (!receiptId || (!itemId && !itemName) || isNaN(amount)) {
        throw new Error('Invalid input parameters');
    }

    // If no itemId, create a new item
    if (!itemId) {
        const result = await db.run(`
            INSERT INTO items (name)
            VALUES (?)
        `, [itemName]);
        itemId = result.lastID;
    }

    // Add item to receipt
    await db.run(`
        INSERT INTO receipt_items (receipt_id, item_id, amount)
        VALUES (?, ?, ?)
    `, [receiptId, itemId, amount]);

    return c.redirect(`.`);
};

const addItem = async (db) => {
    const availableItems = await db.all(`
        SELECT 
            i.id,
            i.name as item_name,
            c.name as category_name
        FROM items i
        JOIN categories c ON i.category_id = c.id
        ORDER BY c.name, i.name
    `);

    return `
        <form method="POST" action="items" style="margin-top: 20px;">
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <div style="flex: 2;">
                    <input type="text" 
                           name="item_name" 
                           class="form-control" 
                           placeholder="Enter item name or select from dropdown" 
                           list="items-list" 
                           required>
                    <datalist id="items-list">
                        ${availableItems
                            .sort((a, b) => {
                                if (a.category_name !== b.category_name) {
                                    return a.category_name.localeCompare(b.category_name);
                                }
                                return a.item_name.localeCompare(b.item_name);
                            })
                            .map(item => `
                                <option data-id="${item.id}" value="${item.item_name}">${item.category_name}</option>
                            `).join('')}
                    </datalist>
                    <input type="hidden" name="item_id">
                </div>
                <div style="flex: 1;">
                    <input type="number" name="amount" step="0.01" required class="form-control" placeholder="Amount">
                </div>
                <div>
                    <button type="submit" class="button">Add Item</button>
                </div>
            </div>
        </form>

        <script>
            // Update hidden item_id based on selected item_name
            document.querySelector('input[name="item_name"]').addEventListener('input', function() {
                const datalist = document.getElementById('items-list');
                const option = Array.from(datalist.options).find(opt => opt.value === this.value);
                document.querySelector('input[name="item_id"]').value = option ? option.dataset.id : '';
            });
        </script>
    `;
};

module.exports = {
    post,
    addItem
};
