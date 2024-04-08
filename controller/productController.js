const productCollection = require("../models/productModel");
const categoryCollection = require("../models/categoryModel");

const productList = async (req, res) => {
  try {
    const proCollection = await productCollection
      .find()
      .populate("parentCategory");
    res.render("adminViews/productList", { productDet: proCollection });
  } catch (err) {
    console.log(err);
  }
};

const addProductPage = async (req, res) => {
  try {
    console.log("add producct called");
    const categoryDetails = await categoryCollection.find();
    res.render("adminViews/addProduct", { categoryDet: categoryDetails });
  } catch (err) {
    console.log(err);
  }
};

const addProduct = async (req, res) => {
  try {
    let imgFiles = [];
    for (i = 0; i < req.files.length; i++) {
      imgFiles[i] = req.files[i].filename;
    }

    const newProduct = new productCollection({
      productName: req.body.productName,
      parentCategory: req.body.parentCategory,
      productImage: imgFiles,
      productPrice: req.body.productPrice,
      productStock: req.body.productStock,
    });
    const productDetails = await productCollection.find({
      productName: {
        $regex: new RegExp("^" + req.body.productName.toLowerCase() + "$", "i"),
      },
    });
    if (
      /^\s*$/.test(req.body.productName) ||
      /^\s*$/.test(req.body.productPrice) ||
      /^\s*$/.test(req.body.productStock)
    ) {
      res.send({ noValue: true });
    } else if (productDetails.length > 0) {
      res.send({ exists: true });
    } else {
      res.send({ success: true });
      newProduct.save();
    }
  } catch (error) {
    console.log("Error while Submitting the ADD product post Form" + error);
  }
};

const blockProduct = async (req, res) => {
  try {
    await productCollection.updateOne(
      { _id: req.query.id },
      { $set: { isListed: false } }
    );
    res.send({ block: true });
  } catch (err) {
    console.log(err);
  }
};
const unBlockProduct = async (req, res) => {
  try {
    await productCollection.updateOne(
      { _id: req.query.id },
      { $set: { isListed: true } }
    );
    res.send({ unBlock: true });
  } catch (err) {
    console.log(err);
  }
};

const editProductPage = async (req, res) => {
  try {
    const categoryDetail = await categoryCollection.find();
    const categoryDet = await categoryCollection.findOne({
      _id: req.query.cid,
    });
    const productDet = await productCollection.findOne({ _id: req.query.pid });
    console.log(productDet);
    res.render("adminViews/editProduct", {
      categoryDet,
      productDet,
      categoryDetail,
    });
  } catch (err) {
    console.log(err);
  }
};

const editProduct = async (req, res) => {
  try {
    let imgFiles = [];
    for (let i = 0; i < req.files.length; i++) {
      imgFiles[i] = req.files[i].filename;
    }
    const productDetails = await productCollection.find({
      productName: {
        $regex: new RegExp("^" + req.body.productName.toLowerCase() + "$", "i"),
      },
    });
    if (
      /^\s*$/.test(req.body.productName) ||
      /^\s*$/.test(req.body.productPrice) ||
      /^\s*$/.test(req.body.productStock)
    ) {
      res.send({ noValue: true });
    }
    // catDetails._id != req.body.categoryId
    else if (
      productDetails.length > 0 &&
      req.body.productName != productDetails.productName
    ) {
      res.send({ exists: true });
    } else {
      await productCollection.updateOne(
        { _id: req.params.id },
        {
          $set: {
            productName: req.body.productName,
            parentCategory: req.body.parentCategory,
            productImage: imgFiles,
            productPrice: req.body.productPrice,
            productStock: req.body.productStock,
          },
        }
      );
      res.send({ success: true });
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  productList,
  addProductPage,
  addProduct,
  blockProduct,
  unBlockProduct,
  editProductPage,
  editProduct,
};
