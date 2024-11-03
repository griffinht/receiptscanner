function ChartSection(data) {
  return `
    <div class="charts-container">
      ${Object.entries(data).map(([month, data], index) => `
        <div class="chart-wrapper">
          <div class="chart-title">${month}</div>
          <canvas id="chart${index}"></canvas>
        </div>
      `).join('')}
    </div>
  `;
}

module.exports = { ChartSection }; 