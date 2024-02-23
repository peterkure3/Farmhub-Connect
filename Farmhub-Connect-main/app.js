// app.js
const express = require('express');
const bodyParser = require('body-parser');
const productRouter = require('./Routes/items');
const userRouter = require('./Routes/user');
const cors = require('cors');
const path = require('path'); // Import the path module
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api', productRouter);
app.use('/users', userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Serve static files from the 'agro_sell' folder
app.use(express.static(path.join(__dirname, 'agro sell')));

// Route for serving the index.html file
app.get('/', (req, res) => {
  // Send the index.html file located in the 'agro_sell' folder
  res.sendFile(path.join(__dirname, 'agro sell', 'landing_page.html'));
});
