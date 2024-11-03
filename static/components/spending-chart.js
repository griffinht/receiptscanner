function createSpendingChart(data, selectedCategory, selectedItem) {
  const ctx = document.getElementById('spendingChart');
  if (!ctx) return;

  // Clear any existing chart
  if (window.currentChart) {
    window.currentChart.destroy();
  }

  const months = Object.keys(data);
  let datasets = [];
  
  // If we're viewing a specific category/store
  if (selectedCategory) {
    if (selectedItem) {
      // Show item spending across months
      datasets = [{
        label: selectedItem,
        data: months.map(month => {
          return data[month][selectedCategory]?.items[selectedItem] || 0;
        }),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }];
    } else {
      // Show all items in the category/store
      const allItems = new Set();
      months.forEach(month => {
        if (data[month][selectedCategory]?.items) {
          Object.keys(data[month][selectedCategory].items).forEach(item => allItems.add(item));
        }
      });

      datasets = Array.from(allItems).map(item => ({
        label: item,
        data: months.map(month => data[month][selectedCategory]?.items[item] || 0),
        backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.2)`,
        borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
        borderWidth: 1
      }));
    }
  } else {
    // Show all categories/stores
    const allCategories = new Set();
    months.forEach(month => {
      Object.keys(data[month]).forEach(cat => allCategories.add(cat));
    });

    datasets = Array.from(allCategories).map(category => ({
      label: category,
      data: months.map(month => data[month][category]?.total || 0),
      backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.2)`,
      borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
      borderWidth: 1
    }));
  }

  window.currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: datasets
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const { datasetIndex } = elements[0];
          const clickedLabel = datasets[datasetIndex].label;
          
          // Get current URL and path
          const url = new URL(window.location.href);
          const path = url.pathname;
          
          if (!selectedCategory) {
            // If we're on the main view, clicking should filter by category/store
            window.location.href = `${path}?${path.includes('stores') ? 'store' : 'category'}=${encodeURIComponent(clickedLabel)}`;
          } else if (!selectedItem) {
            // If we're viewing a category/store, clicking should filter by item
            const params = new URLSearchParams(url.search);
            params.set('item', clickedLabel);
            window.location.href = `${path}?${params.toString()}`;
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
} 