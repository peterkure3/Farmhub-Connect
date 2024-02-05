const bcrypt = require('bcryptjs');

const { Pool } = require('pg');
const connectionString = process.env.DB_CONNECTION_STRING;
const pool = new Pool({ connectionString });

// const { Client } = require('pg');
// const connectionString = process.env.DB_CONNECTION_STRING;

// let client = new Client({ connectionString });
// let isConnected = false;

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

async function addUser(user) {
  // checking if user exists
    const existingUser = await getUser(user.email);
    if (existingUser) {
        throw new Error('User already exists');
    }
    // hashing password
    const hashedPassword = await hashPassword(user.password);
    // saving user to db
    const query = 'INSERT INTO users (email,name,password,business) VALUES ($1, $2, $3, $4)';
    const client = await pool.connect();
    const values = [user.email,user.name, hashedPassword,user.business];
    await client.query(query, values);
}

  // check if user exists
async function getUser(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const client = await pool.connect();
    const values = [email];
    const result = await client.query(query, values);
    return result.rows[0];
}

// hash password
async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

// compare password
async function comparePassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}

// login a user
async function loginUser(email, password) {
    const user = await getUser(email);
    if (user) {
        const isMatch = await comparePassword(password, user.password);
        if (isMatch) {
            return user;
        }
    }
    return null;
}

// forgot password
async function forgotPassword(email) {
    const user = await getUser(email);
    if (user) {
        return user;
    }
    return null;
}

//update password
async function updatePassword(email, password) {
    const user = await getUser(email);
    if (user) {
        const hashedPassword = await hashPassword(password);
        const query = 'UPDATE users SET password = $1 WHERE email = $2';
        const client = await pool.connect();
        const values = [hashedPassword, email];
        await client.query(query, values);
        return true;
    }
    return false;
}

module.exports = {
    addUser,
    getUser,
    hashPassword,
    comparePassword,
    loginUser,
    forgotPassword,
    updatePassword,
    // connect,
};