const TransactionsModal = () => `
  <div id="transactionsModal" class="modal">
    <div class="modal-content">
      <span class="close" onclick="closeModal()">&times;</span>
      <h2 id="modalTitle"></h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Store</th>
            <th>Location</th>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody id="transactionsBody">
        </tbody>
      </table>
    </div>
  </div>
`;

module.exports = { TransactionsModal }; 