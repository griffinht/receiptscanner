function createPieChart(data, selectedCategory, selectedItem) {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  // Clear any existing chart
  if (window.currentPieChart) {
    window.currentPieChart.destroy();
  }

  // Get current URL and path to determine if we're in stores or categories view
  const path = window.location.pathname;
  const isStoresView = path.includes('stores');
  const paramName = isStoresView ? 'store' : 'category';

  let chartData = [];
  let labels = [];
  let title = '';

  const latestMonth = Object.keys(data)[0]; // Assuming first month is latest

  if (selectedCategory) {
    if (selectedItem) {
      // Show monthly breakdown for specific item
      Object.entries(data).forEach(([month, monthData]) => {
        if (monthData[selectedCategory]?.items[selectedItem]) {
          chartData.push(monthData[selectedCategory].items[selectedItem]);
          labels.push(month);
        }
      });
      title = `${selectedItem} Spending by Month`;
    } else {
      // Show items breakdown for selected category/store
      const categoryData = data[latestMonth][selectedCategory];
      if (categoryData?.items) {
        Object.entries(categoryData.items).forEach(([item, amount]) => {
          chartData.push(amount);
          labels.push(item);
        });
      }
      title = `${selectedCategory} Items Breakdown`;
    }
  } else {
    // Show all categories/stores for latest month
    Object.entries(data[latestMonth] || {}).forEach(([key, value]) => {
      chartData.push(value.total);
      labels.push(key);
    });
    title = isStoresView ? 'Store Breakdown' : 'Category Breakdown';
  }

  const backgroundColors = labels.map(() => 
    `hsla(${Math.random() * 360}, 70%, 50%, 0.2)`
  );
  const borderColors = labels.map(() => 
    `hsla(${Math.random() * 360}, 70%, 50%, 1)`
  );

  window.currentPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: chartData,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: title
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: $${value.toFixed(2)}`;
            }
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const clickedLabel = labels[index];
          
          const url = new URL(window.location.href);
          
          if (!selectedCategory) {
            // If we're on the main view, clicking should filter by category/store
            window.location.href = `${url.pathname}?${paramName}=${encodeURIComponent(clickedLabel)}`;
          } else if (!selectedItem) {
            // If we're viewing a category/store, clicking should filter by item
            const params = new URLSearchParams(url.search);
            params.set('item', clickedLabel);
            window.location.href = `${url.pathname}?${params.toString()}`;
          }
        }
      }
    }
  });
} 