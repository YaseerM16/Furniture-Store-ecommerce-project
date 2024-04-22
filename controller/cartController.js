const cartCollection = require("../models/cartModel");
const productCollection = require("../models/productModel");
const addressCollection = require("../models/addressModel");
const orderCollection = require("../models/orderModel");

const addToCart = async (req, res) => {
  try {
    const productExist = await cartCollection.findOne({
      userId: req.session.currentUser._id,
      productId: req.query.pid,
    });

    if (productExist) {
      const presentQty = parseInt(productExist.productQuantity);
      const qty = parseInt(req.query.quantity);
      const productPrice = parseInt(req.query.productPrice);
      console.log(qty);

      await cartCollection.updateOne(
        { productId: req.query.pid },
        {
          $set: {
            productQuantity: presentQty + qty,
            totalCostPerProduct: presentQty + qty * productPrice,
          },
        }
      );
    } else {
      const qty = parseInt(req.query.quantity);
      const productPrice = parseInt(req.query.productPrice);
      const product = {
        userId: req.session.currentUser._id,
        productId: req.query.pid,
        productQuantity: qty,
        totalCostPerProduct: qty * productPrice,
      };
      await cartCollection.insertMany([product]);
    }
    res.send({ success: true });
  } catch (error) {
    console.log("Error While adding the product to the Caart " + error);
  }
};

const cartPage = async (req, res) => {
  try {
    const cartProducts = await cartCollection
      .find({
        userId: req.session.currentUser._id,
      })
      .populate("productId");
    console.log(cartProducts);
    if (!cartProducts || cartProducts.length === 0) {
      // Render the EJS page with an empty cartProducts array
      res.render("userViews/cart", { cartProducts: [] });
    } else {
      // Render the EJS page with the cartProducts data
      res.render("userViews/cart", { cartProducts: cartProducts });
    }
  } catch (error) {
    console.log("Error while showing the Cart Page :" + error);
  }
};

const cartIncBtn = async (req, res) => {
  try {
    const productId = req.query.productID;
    const quantity = parseInt(req.query.quantity);

    // Retrieve the product from the database
    const product = await productCollection.findOne({ _id: productId });
    if (!product) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found" });
    }

    const productStock = parseInt(product.productStock);
    if (quantity < productStock) {
      // If quantity is less than productStock, update the cart
      const cartProduct = await cartCollection.findOneAndUpdate(
        { productId },
        { $inc: { productQuantity: 1 } },
        { new: true } // Return the updated document
      );

      // Send success response with updated cart product
      res.send({ success: true, cartProduct });
    } else {
      res.status(400).send({ success: false, exceed: true });
    }
  } catch (error) {
    console.log("Error while clicking the Cart Increment Button:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
};

const quantityIncBtn = async (req, res) => {
  try {
    const product = await productCollection.findOne({ _id: req.query.pid });
    if (!product) {
      console.log("The product is not existing: !!!!");
    } else {
      const productStock = parseInt(product.productStock);
      console.log(productStock);
      console.log(req.query.inputQty);
      if (req.query.inputQty > productStock) {
        res.send({ exceed: true });
      } else {
        res.send({ avail: true });
      }
    }
  } catch (error) {
    console.log("Error while CLikcking the Add quantity Button :" + error);
  }
};

const addressCheckOutPage = async (req, res) => {
  try {
    req.session.cartData = req.body.cartData;
    req.session.cartTotal = req.query.grandTotal;
    req.session.save();
    const userId = req.session.currentUser._id;
    const userAddress = await addressCollection.find({
      userId: userId,
    });
    res.render("userViews/selectAddress", {
      user: req.session.currentUser,
      addresses: userAddress,
    });
  } catch (error) {
    console.log("Error while showing the First CheckOUt page :" + error);
  }
};

const redirecPaymentMethod = async (req, res) => {
  try {
    if (!req.query.addressId) {
      console.log(req.session.addressId);
      console.log("The Address Id is not retrieve from the CheckOut Page :");
    } else {
      req.session.addressId = req.query.addressId;
      res.send({ success: true });
    }
  } catch (error) {
    console.log("Error Occured While Rendering the Payment Page :" + error);
  }
};

const paymentMethodPage = (req, res) => {
  try {
    // console.log("address Id is retrieved in session:" + req.session.addressId);
    req.session.paymentMethod = "COD";
    res.render("userViews/selectPayment");
  } catch (error) {
    console.log(
      "Error occur WHile rendering the Payment Method Page :" + error
    );
  }
};

const checkoutPage = async (req, res) => {
  try {
    const cartProducts = await cartCollection
      .find({
        userId: req.session.currentUser._id,
      })
      .populate("productId");

    const addressDet = await addressCollection.findOne({
      _id: req.session.addressId,
    });
    console.log(req.session.cartData);
    console.log(req.session.cartTotal);

    if (!cartProducts && !addressDet) {
      console.log("The Cart product or Address is not getting");
    } else {
      res.render("userViews/checkOutPage", {
        cartProducts: cartProducts,
        addressDet: addressDet,
      });
      res.send({ success: true });
    }
  } catch (error) {
    console.log("Error while rendering the Final CheckOut Page: " + error);
  }
};

const placeOrder = async (req, res) => {
  try {
    const cartDet = await cartCollection.find({
      userId: req.session.currentUser._id,
    });
    await orderCollection.insertMany([
      {
        userId: req.session.currentUser._id,
        orderDate: new Date(),
        paymentType: req.session.paymentMethod,
        addressChosen: req.session.addressId,
        cartData: cartDet,
        grandTotalCost: req.session.grandTotal,
      },
    ]);

    for (let cart of cartDet) {
      await productCollection.updateOne(
        { _id: cart.productId },
        { $inc: { productStock: -cart.productQuantity } }
      );
    }

    await cartCollection.deleteMany({ userId: req.session.currentUser._id });

    res.send({ success: true });
  } catch (error) {
    console.log("Error while Placing the Order" + error);
  }
};

module.exports = {
  addToCart,
  cartPage,
  quantityIncBtn,
  addressCheckOutPage,
  redirecPaymentMethod,
  paymentMethodPage,
  checkoutPage,
  placeOrder,
  cartIncBtn,
};
