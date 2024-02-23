// router/userRouter.js
const express = require('express');
const productController = require('../Controllers/itemController');
const { uploadFile } = require("../uploadFile");

const router = express.Router();
router.get('/products', productController.getAllProducts);
router.post('/products', productController.addProduct);
router.post('/products/picture',uploadFile, productController.uploadImage);
router.get('/products/user', productController.getUserProducts);
router.put('/products/update', productController.updateProduct);
router.get('/products/:productId', productController.getProductById);
router.delete('/products/:productId', productController.deleteProductById);
router.get('/products/filter/:name', productController.filterProductsByName);
module.exports = router;