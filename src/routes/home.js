const homeRoute = async (c) => {
  return {
    title: 'Home',
    content: `
      <div class="container">
        <h1>Welcome to Grocery Tracker</h1>
        <p>Track and analyze your grocery spending patterns.</p>
        <!-- rest of your home page content -->
      </div>
    `
  };
};

module.exports = { homeRoute }; 