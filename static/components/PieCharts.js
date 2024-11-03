class PieCharts extends HTMLElement {
  constructor() {
    super();
    this.charts = null;
    this.handleChartClick = this.handleChartClick.bind(this);
  }

  static get observedAttributes() {
    return ['data', 'category', 'item'];
  }

  connectedCallback() {
    // Create container for multiple charts
    this.container = document.createElement('div');
    this.container.style.display = 'flex';
    this.container.style.justifyContent = 'space-around';
    this.container.style.width = '100%';
    this.appendChild(this.container);
    this.initializeCharts();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.initializeCharts();
    }
  }

  disconnectedCallback() {
    if (this.charts) {
      this.charts.forEach(chart => chart.destroy());
    }
  }

  handleChartClick(event, elements) {
    if (!elements.length) return;
    
    const clickedLabel = event.chart.data.labels[elements[0].index];
    const currentCategory = this.getAttribute('category');
    const currentItem = this.getAttribute('item');
    
    // Get current URL and path
    const url = new URL(window.location.href);
    const path = url.pathname;
    
    if (!currentCategory) {
      // If we're on the main view, clicking should filter by category/store
      window.location.href = `${path}?${path.includes('stores') ? 'store' : 'category'}=${encodeURIComponent(clickedLabel)}`;
    } else if (!currentItem) {
      // If we're viewing a category/store, clicking should filter by item
      const params = new URLSearchParams(url.search);
      params.set('item', clickedLabel);
      window.location.href = `${path}?${params.toString()}`;
    }
  }

  initializeCharts() {
    // Clean up existing charts
    if (this.charts) {
      this.charts.forEach(chart => chart.destroy());
    }
    this.container.innerHTML = '';
    this.charts = [];

    const rawData = JSON.parse(this.getAttribute('data') || '{}');
    const categoryParam = this.getAttribute('category');
    const months = Object.keys(rawData);
    
    // Get the last 3 months
    const recentMonths = months.slice(-3);

    // Create a canvas for each month
    recentMonths.forEach(month => {
      const wrapper = document.createElement('div');
      wrapper.style.flex = '1';
      wrapper.style.minWidth = '200px';
      wrapper.style.maxWidth = '400px';
      
      const canvas = document.createElement('canvas');
      wrapper.appendChild(canvas);
      this.container.appendChild(wrapper);

      const chartData = (() => {
        if (categoryParam) {
          // Single category view - show month's breakdown
          const categoryData = rawData[month][categoryParam]?.items || {};
          
          return {
            labels: Object.keys(categoryData),
            datasets: [{
              data: Object.values(categoryData),
              backgroundColor: Object.keys(categoryData).map((_, index) => {
                const hue = index * (360 / Object.keys(categoryData).length);
                return `hsl(${hue}, 70%, 50%)`;
              })
            }]
          };
        } else {
          // Main view - show month's category totals
          const categories = Object.keys(rawData[month] || {});
          
          return {
            labels: categories,
            datasets: [{
              data: categories.map(category => {
                const categoryData = rawData[month][category];
                return categoryData?.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
              }),
              backgroundColor: categories.map((_, index) => {
                const hue = index * (360 / categories.length);
                return `hsl(${hue}, 70%, 50%)`;
              })
            }]
          };
        }
      })();

      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: categoryParam ? 
                `${categoryParam} Items (${month})` : 
                `Categories (${month})`
            },
            legend: {
              position: 'bottom',
              display: true
            }
          },
          onClick: this.handleChartClick
        }
      });

      this.charts.push(chart);
    });
  }
}

// Register the web component
customElements.define('pie-charts', PieCharts);