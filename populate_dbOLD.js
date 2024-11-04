const sqlite3 = require('sqlite3').verbose();
const { stores, locations, categories, items, receipts } = require('./src/data/mockData');

const db = new sqlite3.Database('shopping.db');

db.serialize(() => {
    // Insert stores
    const storeStmt = db.prepare('INSERT INTO stores (id, name) VALUES (?, ?)');
    Object.entries(stores).forEach(([id, name]) => {
        storeStmt.run(id, name);
    });
    storeStmt.finalize();

    // Insert locations
    const locationStmt = db.prepare('INSERT INTO locations (id, store_id, address) VALUES (?, ?, ?)');
    Object.entries(locations).forEach(([id, data]) => {
        locationStmt.run(id, data.store_id, data.location);
    });
    locationStmt.finalize();

    // Insert categories
    const categoryStmt = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
    Object.entries(categories).forEach(([id, name]) => {
        categoryStmt.run(id, name);
    });
    categoryStmt.finalize();

    // Insert items
    const itemStmt = db.prepare('INSERT INTO items (id, name, category_id) VALUES (?, ?, ?)');
    Object.entries(items).forEach(([id, data]) => {
        itemStmt.run(id, data.name, data.category);
    });
    itemStmt.finalize();

    // Insert receipts and receipt items
    const receiptStmt = db.prepare('INSERT INTO receipts (date, location_id) VALUES (?, ?)');
    const receiptItemStmt = db.prepare('INSERT INTO receipt_items (receipt_id, item_id, amount) VALUES (?, ?, ?)');

    // Use Promise to ensure all inserts complete before finalizing
    const promises = receipts.map((receipt) => {
        return new Promise((resolve) => {
            receiptStmt.run(receipt.date, receipt.location, function() {
                const receiptId = this.lastID;
                const transactionPromises = receipt.transactions.map((transaction) => {
                    return new Promise((resolve) => {
                        receiptItemStmt.run(receiptId, transaction.item_id, transaction.amount, resolve);
                    });
                });
                Promise.all(transactionPromises).then(resolve);
            });
        });
    });

    Promise.all(promises).then(() => {
        receiptStmt.finalize();
        receiptItemStmt.finalize();
        db.close();
    });
});