const orderCollection = require("../models/orderModel");
const { ObjectId } = require("mongodb");

const orderPage = async (req, res) => {
  try {
    // const orders = await orderCollection
    //   .find({ userId: req.session.currentUser })
    //   .populate("addressChosen");
    // console.log(orders[0]);
    const id = req.session.currentUser._id;
    const find = new ObjectId(id);
    const orders = await orderCollection.aggregate([
      {
        $unwind: "$cartData",
      },
      {
        $lookup: {
          from: "products", // the name of the collection containing the product documents
          localField: "cartData.productId", // the field in the order document that contains the productId
          foreignField: "_id", // the field in the product document that contains the corresponding productId
          as: "productDetails", // the name of the field to add to the order document that will contain the matching product document(s)
        },
      },
      {
        $unwind: "$productDetails", // "flatten" the productDetails array
      },
    ]);

    // console.log("converted OBJ : " + find._id);
    // const orderCol = await orderCollection.aggregate([
    //   { $match: { userId: find._id } },
    // ]);
    // const orders1 = await orderCollection.find({
    //   userId: req.session.currentUser._id,
    // });
    // console.log(orders);
    // console.log(orders1);
    // console.log(orders[0]);
    // console.log(req.session.currentUser._id);
    // console.log("ervreve");
    console.log(orders);
    res.render("userViews/myOrders", { orders: orders });
  } catch (error) {
    console.log("Error while rendering the My Orders Page: " + error);
  }
};

module.exports = {
  orderPage,
};
