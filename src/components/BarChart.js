const BarChart = (data, selectedCategory, selectedItem) => {
  return `
    <div class="chart-container">
      <canvas id="spendingChart"></canvas>
      <script>
        // Wait for both charts to be available
        document.addEventListener('DOMContentLoaded', function() {
          const path = window.location.pathname;
          const isStoresView = path.includes('stores');
          
          // Pass the data and parameters to the charts
          if (typeof createSpendingChart === 'function') {
            createSpendingChart(${JSON.stringify(data)}, ${JSON.stringify(selectedCategory)}, ${JSON.stringify(selectedItem)});
          }
        });
      </script>
    </div>
  `;
};

module.exports = { BarChart: BarChart }; 