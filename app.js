// app.js
const express = require('express');
const bodyParser = require('body-parser');
const productRouter = require('./Routes/items');

const userRouter = require('./Routes/user');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

app.use(bodyParser.json());

app.use('/api', productRouter);
app.use('/users', userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});