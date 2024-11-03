function initializeLineChart(rawData, categoryParam) {
  const chartData = (() => {
    if (categoryParam) {
      // Handle category view - show items breakdown
      const months = Object.keys(rawData);
      const allItems = new Set();
      
      months.forEach(month => {
        const categoryData = rawData[month][categoryParam];
        if (categoryData?.items) {
          Object.keys(categoryData.items).forEach(item => allItems.add(item));
        }
      });

      return {
        labels: months,
        datasets: Array.from(allItems).map((item, index) => {
          const hue = index * (360 / allItems.size);
          const color = 'hsl(' + hue + ', 70%, 50%)';
          return {
            label: item,
            data: months.map(month => rawData[month][categoryParam]?.items[item] || 0),
            borderColor: color,
            backgroundColor: color.replace('hsl', 'hsla').replace(')', ', 0.5)'),
            tension: 0.1,
            fill: true
          };
        })
      };
    } else {
      // Main view - show categories
      const months = Object.keys(rawData);
      const categories = [...new Set(
        Object.values(rawData)
          .flatMap(monthData => Object.keys(monthData))
      )];

      const datasets = categories.map((category, index) => {
        const hue = index * (360 / categories.length);
        const color = 'hsl(' + hue + ', 70%, 50%)';
        const monthlyData = months.map(month => {
          const categoryData = rawData[month][category];
          return categoryData?.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        });

        return {
          label: category,
          data: monthlyData,
          borderColor: color,
          backgroundColor: color.replace('hsl', 'hsla').replace(')', ', 0.5)'),
          tension: 0.1,
          fill: true
        };
      });

      return {
        labels: months,
        datasets: datasets
      };
    }
  })();

  // Create the chart
  const ctx = document.getElementById('trendLineChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: categoryParam ? (categoryParam + ' Items Breakdown by Month') : 'Monthly Spending by Category'
        },
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount ($)'
          }
        }
      }
    }
  });
} 