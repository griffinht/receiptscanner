const { html } = require('hono/html');

const receiptsRoute = async (c, db) => {
  const receipts = await db.all(`
    SELECT 
      receipts.id,
      receipts.date,
      stores.name as store_name,
      locations.address as location,
      SUM(receipt_items.amount) as total
    FROM receipts
    JOIN locations ON receipts.location_id = locations.id
    JOIN stores ON locations.store_id = stores.id
    JOIN receipt_items ON receipt_items.receipt_id = receipts.id
    GROUP BY receipts.id, receipts.date, stores.name, locations.address
    ORDER BY receipts.date DESC
  `);

  const content = html`
    <div class="container">
      <h1>All Receipts</h1>
      <table class="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Store</th>
            <th>Location</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${receipts.map(receipt => html`
            <tr>
              <td>${new Date(receipt.date).toLocaleDateString()}</td>
              <td>${receipt.store_name}</td>
              <td>${receipt.location}</td>
              <td>$${receipt.total ? receipt.total.toFixed(2) : '0.00'}</td>
              <td>
                <a href="/receipts/${receipt.id}" class="button">Edit</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return {
    title: 'All Receipts',
    content
  };
};

module.exports = {
  receiptsRoute
}; 