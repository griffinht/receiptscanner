class SpendingChart extends HTMLElement {
  constructor() {
    super();
    this.chart = null;
  }

  connectedCallback() {
    // Create canvas if it doesn't exist
    if (!this.querySelector('canvas')) {
      const canvas = document.createElement('canvas');
      this.appendChild(canvas);
    }

    // Wait for next frame to ensure canvas is ready
    requestAnimationFrame(() => {
      try {
        const canvas = this.querySelector('canvas');
        if (!canvas) {
          console.error('Canvas element not found in spending-chart');
          return;
        }

        const data = JSON.parse(this.getAttribute('data') || '{}');
        const month = this.getAttribute('month');
        const isDetailView = this.getAttribute('is-detail-view') === 'true';
        const isItemView = this.getAttribute('is-item-view') === 'true';
        
        this.renderChart(canvas, data, month, isDetailView, isItemView);
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    });
  }

  renderChart(canvas, data, month, isDetailView, isItemView) {
    const monthData = data[month];
    if (!monthData) {
      console.error('No data found for month:', month, data);
      return;
    }

    const labels = isItemView
      ? monthData[Object.keys(monthData)[0]].transactions.map(t => new Date(t.date).toLocaleDateString())
      : isDetailView
        ? Object.keys(monthData[Object.keys(monthData)[0]].items)
        : Object.keys(monthData);

    const values = isItemView
      ? monthData[Object.keys(monthData)[0]].transactions.map(t => t.amount)
      : isDetailView
        ? Object.values(monthData[Object.keys(monthData)[0]].items)
        : Object.values(monthData).map(categoryData => categoryData.total);

    console.log('Processed Data:', { labels, values }); // Debug log

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#C9CBCF'
          ],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return label + ': $' + value.toFixed(2);
              }
            }
          }
        },
        onClick: isItemView ? null : (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            if (isDetailView) {
              const currentCategory = Object.keys(monthData)[0];
              const item = Object.keys(monthData[currentCategory].items)[index];
              window.location.href = `?category=${currentCategory}&item=${encodeURIComponent(item)}`;
            } else {
              const category = Object.keys(monthData)[index];
              window.location.href = `?category=${encodeURIComponent(category)}`;
            }
          }
        }
      }
    });
  }

  disconnectedCallback() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

customElements.define('spending-chart', SpendingChart); 