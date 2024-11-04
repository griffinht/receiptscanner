const NavBar = (activePage) => `
  <nav class="top-nav">
    <ul>
      <li><a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
      <li><a href="/categories" class="${activePage === 'categories' ? 'active' : ''}">Categories</a></li>
      <li><a href="/stores" class="${activePage === 'stores' ? 'active' : ''}">Stores</a></li>
    </ul>
  </nav>
`;

const BaseHTML = (title, content, activePage) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Receipt Scanner - ${title}</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link rel="stylesheet" href="/css/main.css">
      <link rel="stylesheet" href="/css/charts.css">
      <link rel="stylesheet" href="/css/transactions.css">
      <link rel="stylesheet" href="/css/modal.css">
      <link rel="stylesheet" href="/css/nav.css">
      <script src="/components/LineChart.js"></script>
      <script src="/components/BarChart.js"></script>
      <script src="/components/PieCharts.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    </head>
    <body>
      ${NavBar(activePage)}
      ${content}
    </body>
  </html>
`;

module.exports = { BaseHTML }; 