// models/user.js
const { Pool } = require('pg');
const connectionString = process.env.DB_CONNECTION_STRING;
const pool = new Pool({ connectionString });

// client.on('error', (err) => {
//   console.error('Unexpected error on idle client', err);
//   isConnected = false;
//   reconnect(); // Attempt to reconnect
// });

// async function connect() {
//   if (!isConnected) {
//     try {
//       await client.connect();
//       isConnected = true;
//       console.log('Connected to the database');
//     } catch (error) {
//       console.error('Failed to connect to the database', error);
//       isConnected = false;
//       reconnect(); // Attempt to reconnect
//     }
//   }
// }

// function reconnect() {
//   if (!isConnected) {
//     setTimeout(() => {
//       console.log('Attempting to reconnect to the database...');
//       client.end(); // Close the existing client
//       client = new Client({ connectionString }); // Create a new client
//       client.on('error', (err) => {
//         console.error('Unexpected error on idle client', err);
//         isConnected = false;
//         reconnect();
//       });
//       connect(); // Attempt to connect with the new client
//     }, 5000); // Wait for 5 seconds before attempting to reconnect
//   }
// }

async function getProduct() {
  const query = 'SELECT * FROM products';
  const client = await pool.connect();
  try {
      const result = await client.query(query);
      return result.rows;
  } finally {
      client.release(); // Always release the client
  }
}

// async function addProduct(product) {
//   const query = 'INSERT INTO products (name, price, contact, location,imageUrl) VALUES ($1, $2, $3, $4,$5)';
//   const values = [product.name, product.price, product.contact, product.location,product.imageUrl];
//   await client.query(query, values);
// }
async function addProduct(product, userId) {
  const query = 'INSERT INTO products (name, price, contact, location, imageUrl, userId) VALUES ($1, $2, $3, $4, $5, $6)';
  const client = await pool.connect();
  const values = [product.name, product.price, product.contact, product.location, product.imageUrl, userId];
  await client.query(query, values);
}

async function getProductsByUserId(userId) {
  console.log(`The entered user id is ${userId}`);
  const query = 'SELECT * FROM products WHERE userId = $1';
  const client = await pool.connect();
  const values = [userId];
  const result = await client.query(query, values);
  return result.rows;
}

async function updateProduct(productId, product) {
  const query = 'UPDATE products SET name = $1, price = $2, contact = $3, location = $4, imageUrl = $5 WHERE id = $6';
  const client = await pool.connect();
  const values = [product.name, product.price, product.contact, product.location, product.imageUrl, productId];
  await client.query(query, values);
}

async function getProductById(productId) {
  const query = 'SELECT * FROM products WHERE id = $1';
  const client = await pool.connect();
  const values = [productId];
  const result = await client.query(query, values);
  return result.rows[0]; // Assuming id is unique, there should only be one or no result
}

async function deleteProductById(productId) {
  const query = 'DELETE FROM products WHERE id = $1';
  const client = await pool.connect();
  const values = [productId];
  await client.query(query, values);
}

// filterig a product by name 
async function filterProductByName(name) {
  const query = 'SELECT * FROM products WHERE name ILIKE $1';
  const client = await pool.connect();
  const values = [`%${name}%`]; 
  const result = await client.query(query, values);
  return result.rows;
}

module.exports = {
  getProduct,
  addProduct,
  getProductsByUserId,
  updateProduct,
  getProductById,
  deleteProductById,
  filterProductByName,
};
