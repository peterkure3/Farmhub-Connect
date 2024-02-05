// views/userView.js
function renderProducts(products) {
    console.log('Products:');
    products.forEach((product) => {
      console.log(`${product.name}`);
    });
  }
  
  function renderSuccessMessage(message) {
    console.log(`Success: ${message}`);
  }
  
  module.exports = {
    renderProducts,
    renderSuccessMessage,
  };