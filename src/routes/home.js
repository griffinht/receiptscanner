const { BaseHTML } = require('../templates/base');

const homeRoute = async (c) => {
  const content = `
    <div class="container">
      <h1>Welcome to Receipt Scanner</h1>
      <p>Select a section above to view detailed spending analysis.</p>
    </div>
  `;
  return c.html(BaseHTML('Home', content, 'home'));
};

module.exports = { homeRoute }; 