function ChartSection(data, category, item) {
  return `
    <div class="chart-section">
      ${Object.keys(data).map(month => `
        <div class="chart-container">
          <h3>${month}</h3>
          <spending-chart
            data='${JSON.stringify({ [month]: data[month] })}'
            month="${month}"
            is-detail-view="${Boolean(category)}"
            is-item-view="${Boolean(item)}"
          ></spending-chart>
        </div>
      `).join('')}
    </div>
  `;
}

module.exports = { ChartSection }; 