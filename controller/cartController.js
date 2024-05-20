const cartCollection = require("../models/cartModel");
const productCollection = require("../models/productModel");
const addressCollection = require("../models/addressModel");
const orderCollection = require("../models/orderModel");
const userCollection = require("../models/userModel");
const couponCollection = require("../models/couponModel");
const walletCollection = require("../models/walletModel");

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

      await cartCollection.updateOne(
        { productId: req.query.pid },
        {
          $set: {
            productQuantity: presentQty + qty,
            totalCostPerProduct: (presentQty + qty) * productPrice,
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

const removeFromCart = async (req, res) => {
  try {
    const userId = req.query.userID;
    const productId = req.query.productID;

    const result = await cartCollection.deleteOne({
      userId: userId,
      productId: productId,
    });

    if (result.deletedCount > 0) {
      res.send({ success: true, message: "Product removed from cart." });
    } else {
      res.status(404).send("Product not found in cart.");
    }
  } catch (error) {
    console.log("Error while Remove the Product from the Cart Page :" + error);
  }
};

const cartPage = async (req, res) => {
  try {
    let user;
    if (req.session.logged) {
      const email = req.session.currentUser.email;
      user = await userCollection.findOne({ email: email });
    } else {
      user = {};
    }
    const cartProducts = await cartCollection
      .find({
        userId: req.session.currentUser._id,
      })
      .populate("productId");
    if (!cartProducts || cartProducts.length === 0) {
      // Render the EJS page with an empty cartProducts array
      res.render("userViews/cart", { cartProducts: [], user: user });
    } else {
      // Render the EJS page with the cartProducts data
      res.render("userViews/cart", { cartProducts: cartProducts, user: user });
    }
  } catch (error) {
    console.log("Error while showing the Cart Page :" + error);
  }
};

const cartIncDecBtn = async (req, res) => {
  try {
    const productId = req.query.productID;
    const quantity = parseInt(req.query.quantity);
    const action = req.query.action;

    // Retrieve the product from the database
    const product = await productCollection.findOne({ _id: productId });
    const productPrice = parseInt(product.productPrice);
    if (!product) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found" });
    }

    const productStock = parseInt(product.productStock);
    const updateTotalCostPerProduct = quantity * productPrice;
    if (action === "minus") {
      // If action is 'minus' and quantity > 0, decrement the cart
      if (quantity > 1) {
        const cartProduct = await cartCollection.findOneAndUpdate(
          { productId },
          {
            $inc: { productQuantity: -1 },
            $set: {
              totalCostPerProduct: updateTotalCostPerProduct - productPrice,
            },
          },
          { new: true } // Return the updated document
        );

        // Send success response with updated cart product
        res.send({
          success: true,
          quantity: quantity - 1,
          action: "minus",
          totalCostPerProduct: updateTotalCostPerProduct - productPrice,
        });
      } else {
        res.send({
          success: false,
          quantity: quantity + 1,
          message: "Invalid quantity",
        });
      }
    } else if (action === "plus") {
      // If action is 'plus' and quantity < productStock, increment the cart
      if (quantity < productStock) {
        const cartProduct = await cartCollection.findOneAndUpdate(
          { productId },
          {
            $inc: { productQuantity: 1 },
            $set: {
              totalCostPerProduct: updateTotalCostPerProduct + productPrice,
            },
          },
          { new: true } // Return the updated document
        );

        // Send success response with updated cart product
        res.send({
          success: true,
          quantity: quantity + 1,
          action: "plus",
          totalCostPerProduct: updateTotalCostPerProduct + productPrice,
        });
      } else {
        res.status(400).send({ success: false, exceed: true });
      }
    } else {
      res.status(400).send({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    console.log(
      "Error while clicking the Cart Increment/Decrement Button:",
      error
    );
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
    let user;
    if (req.session.logged) {
      const email = req.session.currentUser.email;
      user = await userCollection.findOne({ email: email });
    } else {
      user = {};
    }
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
      user: user,
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

const paymentMethodPage = async (req, res) => {
  try {
    let user;
    if (req.session.logged) {
      const email = req.session.currentUser.email;
      user = await userCollection.findOne({ email: email });
    } else {
      user = {};
    }
    // console.log("address Id is retrieved in session:" + req.session.addressId);
    req.session.couponApplied = false;

    res.render("userViews/selectPayment", { user: user });
  } catch (error) {
    console.log(
      "Error occur WHile rendering the Payment Method Page :" + error
    );
  }
};

const checkoutPage = async (req, res) => {
  try {
    let user;
    if (req.session.logged) {
      const email = req.session.currentUser.email;
      user = await userCollection.findOne({ email: email });
    } else {
      user = {};
    }
    req.session.paymentMethod = req.query.paymentmethod;
    const cartProducts = await cartCollection
      .find({
        userId: req.session.currentUser._id,
      })
      .populate("productId");

    const addressDet = await addressCollection.findOne({
      _id: req.session.addressId,
    });

    let inSufficienBalance = null;

    /// Check for Wallet Balance
    if (req.query.paymentmethod === "wallet") {
      const userWallet = await walletCollection.findOne({
        userId: req.session.currentUser._id,
      });
      const transactionAmount = req.session.cartTotal;
      const walletBalance = userWallet.walletBalance;

      if (walletBalance < transactionAmount) {
        inSufficienBalance = "wallet";
      }
    }

    const coupons = await couponCollection.find({ currentStatus: true });

    if (!cartProducts && !addressDet) {
      console.log("The Cart product or Address is not getting");
    } else {
      res.render("userViews/checkOutPage", {
        cartProducts: cartProducts,
        addressDet: addressDet,
        user: user,
        coupons,
        grandTotal: req.session.cartTotal,
        paymentMethod: req.query.paymentmethod,
        inSufficienBalance,
      });
    }
  } catch (error) {
    console.log("Error while rendering the Final CheckOut Page: " + error);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const requestCoupon = await couponCollection.findOne({
      _id: req.query.couponID,
      currentStatus: true,
    });
    if (req.session.couponApplied) {
      res.send({ couponCodeExists: true });
    } else {
      const minimumPurchase = requestCoupon.minimumPurchase;
      const discountPercent = requestCoupon.discountPercentage;
      const grandTotal = req.query.grandTotal;
      let discountAmount;
      let appliedDisCount;
      if (req.query.grandTotal >= minimumPurchase) {
        appliedDisCount = (grandTotal * discountPercent) / 100;
        discountAmount = grandTotal - (grandTotal * discountPercent) / 100;
        req.session.couponApplied = true;
        req.session.cartTotal = discountAmount;
      }
      res.send({ couponCofirmed: true, discountAmount, appliedDisCount });
    }
  } catch (error) {
    console.log("Error While applying the coupon in the server side: " + error);
  }
};

const placeOrder = async (req, res) => {
  try {
    const cartDet = await cartCollection.find({
      userId: req.session.currentUser._id,
    });
    for (let cart of cartDet) {
      await productCollection.updateOne(
        { _id: cart.productId },
        { $inc: { productStock: -cart.productQuantity } }
      );
    }

    const clonedCartDet = cartDet.map((cart) => ({ ...cart }));

    if (req.session.paymentMethod == "wallet") {
      const userWallet = await walletCollection.findOne({
        userId: req.session.currentUser._id,
      });
      const availAmt = userWallet.walletBalance;
      const transactionAmount = req.session.cartTotal;

      const transactionDate = new Date();
      const firstPer = await walletCollection.findOneAndUpdate(
        { userId: req.session.currentUser._id },
        {
          $inc: { walletBalance: -transactionAmount },
          $push: {
            walletTransaction: {
              transactionDate: transactionDate,
              transactionAmount: transactionAmount,
              transactionType: "Debited",
              transactionMethod: "Purchased Products",
            },
          },
        },

        { new: true }
      );
    }

    if (req.session.paymentMethod == "paypal") {
      res.redirect(`/payPalPaymentPage?total=${req.session.cartTotal}`);
    }

    await cartCollection.deleteMany({ userId: req.session.currentUser._id });

    await orderCollection.insertMany([
      {
        userId: req.session.currentUser._id,
        orderDate: new Date(),
        paymentType: req.session.paymentMethod,
        addressChosen: req.session.addressId,
        cartData: clonedCartDet,
        grandTotalCost: req.session.cartTotal,
      },
    ]);

    req.session.cartTotal = null;
    req.session.couponApplied = false;
    req.session.save();

    res.render("userViews/orderSuccess");
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
  applyCoupon,
  placeOrder,
  cartIncDecBtn,
  removeFromCart,
};
