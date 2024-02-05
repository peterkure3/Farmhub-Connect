// controllers/userController.js
const productModel = require('../Models/item');
const productView = require('../Views/itemView');
const { Upload } = require("../uploadFile");
const mime = require("mime-types");
async function getAllProducts(req, res) {
  // await productModel.connect();
  const products = await productModel.getProduct();
  productView.renderProducts(products);
  res.send(products);
}

async function addProduct(req, res) {
  const newProduct = req.body;
  const userId = newProduct.userid;
  // await productModel.connect();
  await productModel.addProduct(newProduct, userId);
  productView.renderSuccessMessage('product added successfully');
  res.send({
    success: true,
    message: "product added successfully",
  });
}

async function getUserProducts(req, res) {
  const userId = req.query.userid;

  if (!userId) {
    return res.status(400).send({ error: "User ID is required" });
  }

  try {
    // await productModel.connect();
    const products = await productModel.getProductsByUserId(userId);
    productView.renderProducts(products);
    res.send(products);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
}

async function uploadImage(req, res) {
  try{
    const file = req.file;

    if (file == undefined) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file!",
      });
    }

    const mimeType = mime.lookup(file.originalname);
    const isImage = mimeType && mimeType.startsWith("image");
    if (!isImage) {
      return res.status(400).json({
        success: false,
        message: "Please provide file of image type !",
      });
    }
    const imagePath = `products/${Date.now()}_${file.originalname}`;
    const upload = await new Upload(imagePath).add(file);
    const url = upload?.url;

    const params = {
      imageUrl: url,
      imagePath: imagePath,
    };

    res.send({
      success: true,
      message: "File uploaded successfully",
      data: params,
    });

  } catch (error) {
    console.error(error);
    res.send({
      success: false,
      message: "File uploaded failed",
      data: null,
    });
  }
}

async function updateProduct(req, res) {
  const productId = req.body.productid;
  console.log(`The entered product id is ${productId}`);
  const productUpdates = req.body;
  // await productModel.connect();
  await productModel.updateProduct(productId, productUpdates);
  productView.renderSuccessMessage('product updated successfully');
  res.send({
    success: true,
    message: "product updated successfully",
  });
}

async function getProductById(req, res) {
  const productId = req.params.productId;
  try {
    // await productModel.connect();
    const product = await productModel.getProductById(productId);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.send(product);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
}

async function deleteProductById(req, res) {
  const productId = req.params.productId;
  try {
    // await productModel.connect();
    await productModel.deleteProductById(productId);
    res.send({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
}

// filter products by name
async function filterProductsByName(req, res) {
  const name = req.params.name;
  try {
    // await productModel.connect();
    const products = await productModel.filterProductByName(name);
    productView.renderProducts(products);
    res.send(products);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
}

module.exports = {
  getAllProducts,
  addProduct,
  uploadImage,
  getUserProducts,
  updateProduct,
  getProductById,
  deleteProductById,
  filterProductsByName,
};
