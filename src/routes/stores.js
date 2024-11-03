const { BaseHTML } = require('../templates/base');

const storesRoute = async (c) => {
  const content = `
    <div class="container">
      <h1>Store Analysis</h1>
      <p>Store analysis features coming soon...</p>
    </div>
  `;
  return c.html(BaseHTML('Stores', content, 'stores'));
};

module.exports = { storesRoute }; 