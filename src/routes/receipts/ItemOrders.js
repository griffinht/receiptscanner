// Implementation of sortItemsByOrder
async function sortItemsByOrder(db, receiptId) {
  return db.all(`
    SELECT 
      ri.id as receipt_item_id,
      i.id as item_id,
      i.name as item_name,
      c.name as category_name,
      ri.amount,
      ri.display_order
    FROM receipt_items ri
    JOIN items i ON ri.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    WHERE ri.receipt_id = ?
    ORDER BY ri.display_order NULLS LAST, ri.item_id
  `, [receiptId]);
}

// Implementation of setOrdersForReceipt
async function setOrdersForReceipt(db, receiptId, orderMap) {
  // Start a transaction to ensure all updates are atomic
  await db.run('BEGIN TRANSACTION');
  
  try {
    // Update each item's display order
    for (const [itemId, order] of orderMap) {
      await db.run(`
        UPDATE receipt_items 
        SET display_order = ? 
        WHERE id = ? AND receipt_id = ?
      `, [order, itemId, receiptId]);
    }
    
    // Commit the transaction
    await db.run('COMMIT');
  } catch (error) {
    // If there's an error, rollback the transaction
    await db.run('ROLLBACK');
    throw error;
  }
}

module.exports = {
  sortItemsByOrder,
  setOrdersForReceipt
};
