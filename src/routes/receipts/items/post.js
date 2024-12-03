const post = async (c, db) => {
    const receiptId = parseInt(c.req.param('id'));
    const formData = await c.req.parseBody();
    let itemId = parseInt(formData.item_id);
    const itemName = formData.item_name;
    const amount = parseFloat(formData.amount);
    const categoryId = parseInt(formData.category_id);

    // Validate inputs
    if (!receiptId || (!itemId && !itemName) || isNaN(amount) || (!itemId && !categoryId)) {
        throw new Error('Invalid input parameters');
    }

    // If no itemId, create a new item
    if (!itemId) {
        const result = await db.run(`
            INSERT INTO items (name, category_id)
            VALUES (?, ?)
        `, [itemName, categoryId]);
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
            c.name as category_name,
            c.id as category_id
        FROM items i
        JOIN categories c ON i.category_id = c.id
        ORDER BY c.name, i.name
    `);

    const categories = await db.all(`
        SELECT id, name
        FROM categories
        ORDER BY name
    `);

    return `
        <form method="POST" action="items" style="margin-top: 20px;" autocomplete="off">
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <div style="flex: 2;">
                    <input type="text" 
                           name="item_name" 
                           class="form-control" 
                           placeholder="Enter item name or select from dropdown" 
                           list="items-list" 
                           required
                           autocomplete="off">
                    <datalist id="items-list">
                        ${availableItems.map(item => `
                            <option data-id="${item.id}" 
                                    data-category="${item.category_name}"
                                    data-category-id="${item.category_id}" 
                                    value="${item.item_name}">
                                ${item.category_name}
                            </option>
                        `).join('')}
                    </datalist>
                    <input type="hidden" name="item_id" autocomplete="off">
                </div>
                <div style="flex: 1;">
                    <input type="text"
                           name="category_name"
                           class="form-control"
                           placeholder="Select category"
                           list="categories-list"
                           required
                           autocomplete="off">
                    <datalist id="categories-list">
                        ${categories.map(category => `
                            <option data-id="${category.id}" value="${category.name}">
                        `).join('')}
                    </datalist>
                    <input type="hidden" name="category_id" required autocomplete="off">
                </div>
                <div style="flex: 1;">
                    <input type="number" 
                           name="amount" 
                           step="0.01" 
                           required 
                           class="form-control" 
                           placeholder="Amount"
                           autocomplete="off">
                </div>
                <div>
                    <button type="submit" class="button">Add Item</button>
                </div>
            </div>
        </form>

        <script>
            // Update hidden item_id and category based on selected item_name
            document.querySelector('input[name="item_name"]').addEventListener('input', function() {
                const datalist = document.getElementById('items-list');
                const option = Array.from(datalist.options).find(opt => opt.value === this.value);
                const itemIdInput = document.querySelector('input[name="item_id"]');
                const categoryInput = document.querySelector('input[name="category_name"]');
                const categoryIdInput = document.querySelector('input[name="category_id"]');
                
                if (option) {
                    itemIdInput.value = option.dataset.id;
                    categoryInput.value = option.dataset.category;
                    categoryIdInput.value = option.dataset.categoryId;
                    categoryInput.setAttribute('disabled', 'true'); // Disable category input
                } else {
                    itemIdInput.value = '';
                    categoryInput.value = '';
                    categoryIdInput.value = '';
                    categoryInput.removeAttribute('disabled'); // Enable category input
                }
            });

            // Update hidden category_id based on selected category_name
            document.querySelector('input[name="category_name"]').addEventListener('input', function() {
                const datalist = document.getElementById('categories-list');
                const option = Array.from(datalist.options).find(opt => opt.value === this.value);
                const categoryIdInput = document.querySelector('input[name="category_id"]');
                
                if (option) {
                    categoryIdInput.value = option.dataset.id;
                } else {
                    categoryIdInput.value = '';
                }
            });
        </script>
    `;
};

module.exports = {
    post,
    addItem
};
