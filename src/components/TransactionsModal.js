function TransactionsModal() {
  // This component doesn't need data passed in as it's populated dynamically via JavaScript
  return `
    <div id="transactionsModal" class="modal">
      <div class="modal-content">
        <span class="close-button" onclick="closeModal()">&times;</span>
        <h2 class="modal-title" id="modalTitle"></h2>
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
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
}

module.exports = { TransactionsModal }; 