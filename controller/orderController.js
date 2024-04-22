const orderCollection = require("../models/orderModel");

const orderPage = async (req, res) => {
  try {
    const orders = await orderCollection.find();
    res.render("userViews/myOrders", { orders: orders });
  } catch (error) {
    console.log("Error while rendering the My Orders Page: " + error);
  }
};

module.exports = {
  orderPage,
};
