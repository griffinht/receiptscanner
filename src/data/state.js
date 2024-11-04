// Create a new file to store shared state
const state = {
  itemLastUsed: new Map()
};

// Helper function to get current timestamp
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

module.exports = { 
  ...state,
  getCurrentTimestamp 
}; 