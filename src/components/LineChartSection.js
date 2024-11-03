function LineChartSection(displayData, category, item) {
  return `
    <div class="chart-container">
      <canvas id="trendLineChart"></canvas>
      <script>
        initializeLineChart(${JSON.stringify(displayData)}, '${category || ''}');
      </script>
    </div>
  `;
}

module.exports = { LineChartSection }; 