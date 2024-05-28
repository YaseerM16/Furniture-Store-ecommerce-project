const { ObjectId } = require("mongodb");
const orderCollection = require("../models/orderModel");
const { calcStatus } = require("../helpers/helper");
const adminCollection = require("../models/adminModel");

const orderListPage = async (req, res) => {
  try {
    let user;
    if (req.session.adminLog) {
      user = await adminCollection.findOne({ _id: req.session.adminUser._id });
    } else {
      user = {};
    }

    const page = Number(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const orders = await orderCollection
      .find()
      .populate("userId")
      .skip(skip)
      .limit(limit);

    let pages;

    await orderCollection
      .countDocuments()
      .then((count) => {
        pages = count;
      })
      .catch((err) => console.log("Error while counting the docment" + err));

    res.render("adminViews/orderList", {
      orders: orders,
      page: page,
      pages: Math.ceil(pages / limit),
      user: user,
    });
  } catch (error) {
    console.log(
      "ERR while Rendering the Order LIst  Page in the admin side: " + error
    );
  }
};

const orderSummaryDetails = async (req, res) => {
  try {
    let user = await adminCollection.findOne({
      _id: req.session.adminUser._id,
    });
    const orderId = new ObjectId(req.query.orderID);
    const orderTot = await orderCollection.findOne({ _id: req.query.orderID });

    const grandTotal = orderTot.grandTotalCost;
    const orderDet = await orderCollection.aggregate([
      { $match: { _id: orderId } },
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
      {
        $lookup: {
          from: "addresses", // Assuming "addresses" is the name of the collection containing address documents
          localField: "addressChosen",
          foreignField: "_id",
          as: "addressDetails",
        },
      },
      { $unwind: "$addressDetails" },
    ]);

    // ////////------Check for all Products Status and update Order Status ----//////

    const orderCancelUpdate = await orderCollection.findOne({
      _id: req.query.orderID,
    });

    /// ["shipped","shipped","shipped"] - shipped

    let calculatedStatus = calcStatus(orderCancelUpdate);
    if (calculatedStatus.allSameStatus) {
      orderStatus = calculatedStatus.productStatusValues[0];
      await orderCollection.updateOne(
        { _id: req.query.orderID },
        { $set: { orderStatus: calculatedStatus.productStatusValues[0] } }
      );
    }

    /// ["cancelled","cancelled","cancelled"] - cancelled
    else if (calculatedStatus.allCancelled) {
      orderStatus = "Cancelled";
      await orderCollection.updateOne(
        { _id: req.query.orderID },
        { $set: { orderStatus: "Cancelled" } }
      );
    }

    /// ["cancelled","shipped","shipped"] - shipped
    else if (calculatedStatus.oneCancelledAndRestSame) {
      orderStatus = calculatedStatus.productStatusValues.find(
        (val) => val !== "Cancelled"
      );
      await orderCollection.updateOne(
        { _id: req.query.orderID },
        { $set: { orderStatus: orderStatus } }
      );
    }

    /// ["cancelled","shipped","cancelled"] - shipped
    else if (calculatedStatus.nonCancelledCount === 1) {
      orderStatus = calculatedStatus.differentStatus;
      await orderCollection.updateOne(
        { _id: req.query.orderID },
        { $set: { orderStatus: calculatedStatus.differentStatus } }
      );
    }

    ///["cancelled","delivered","shipped"] - pending
    else {
      orderStatus = "Pending";
      await orderCollection.updateOne(
        { _id: req.query.orderID },
        { $set: { orderStatus: "Pending" } }
      );
    }

    ///////////////////// --------- ////////////////////////

    req.session.orderStatus = orderStatus;

    res.render("adminViews/orderSummary", {
      orders: orderDet,
      grandTotal: grandTotal,
      orderID: req.query.orderID,
      orderStatus: orderStatus,
      user,
    });
  } catch (error) {
    console.log(
      "Errror while Getting the Order Summary through the Order Management OrderId Clicking :" +
        error
    );
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const orderStatus = req.body.orderStatus;
    const cartProdId = req.body.cartProdId;

    const result = await orderCollection.updateOne(
      {
        _id: orderId,
        cartData: { $elemMatch: { _id: cartProdId } },
      },
      {
        $set: { "cartData.$.productStatus": orderStatus },
      }
    );

    ////////------Check for all Products Status and update Order Status ----//////

    // const orderCancelUpdate = await orderCollection.findOne({
    //   _id: orderId,
    // });

    // const productStatusValues = orderCancelUpdate.cartData.map(
    //   (item) => item.productStatus
    // );

    // console.log(productStatusValues);
    // const allEqual = productStatusValues.every((val, i, arr) => val === arr[0]);
    // console.log(allEqual);
    // console.log(productStatusValues[0]);
    // if (allEqual) {
    //   await orderCollection.updateOne(
    //     { _id: req.query.orderId },
    //     { $set: { orderStatus: productStatusValues[0] } }
    //   );
    // } else if (!allEqual) {
    //   await orderCollection.updateOne(
    //     { _id: req.query.orderId },
    //     { $set: { orderStatus: "Pending" } }
    //   );
    // }

    //////////// --------- ///////////

    if (result.modifiedCount > 0) {
      res.status(200).send({
        success: true,
        message: "Order status updated successfully",
      });
    } else {
      res.status(404).send({ failed: true, error: "Order not found" });
    }
  } catch (error) {
    console.log(
      "Error while updating the status of the order from the admin order controller:" +
        error
    );
    res.status(500).send({ message: "Error updating order status" });
  }
};

module.exports = {
  orderListPage,
  orderSummaryDetails,
  updateOrderStatus,
};
