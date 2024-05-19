const adminCollection = require("../models/adminModel");
const couponCollection = require("../models/couponModel");

const couponsPage = async (req, res) => {
  try {
    let user = await adminCollection.findOne({
      _id: req.session.adminUser._id,
    });

    await updateCouponsStatus();

    const coupons = await couponCollection.find({ currentStatus: true });

    res.render("adminViews/couponsList", {
      user,
      page: 1,
      pages: 2,
      coupons,
    });
  } catch (error) {
    console.log("Error While list the coupons in the admin side :" + error);
  }
};

const addCoupon = async (req, res) => {
  try {
    let existingCoupon = await couponCollection.findOne({
      couponCode: { $regex: new RegExp(req.body.couponCode, "i") },
    });
    if (!existingCoupon) {
      let currentStatusVal =
        new Date(req.body.expiryDate) >= new Date() &&
        new Date(req.body.startDate) <= new Date();
      await couponCollection.insertMany([
        {
          couponCode: req.body.couponCode,
          discountPercentage: req.body.discountPercentage,
          startDate: new Date(req.body.startDate),
          expiryDate: new Date(req.body.expiryDate),
          minimumPurchase: req.body.minimumPurchase,
          maximumDiscount: req.body.maximumDiscount,
          currentStatus: currentStatusVal,
        },
      ]);
      res.send({ couponAdded: true });
    } else {
      res.send({ couponCodeExists: true });
    }
  } catch (error) {
    console.error(error);
  }
};

const editCoupon = async (req, res) => {
  try {
    let existingCoupon = await couponCollection.findOne({
      couponCode: { $regex: new RegExp(req.body.couponCode, "i") },
    });
    if (!existingCoupon || existingCoupon._id == req.params.id) {
      let updateFields = {
        couponCode: req.body.couponCode,
        discountPercentage: req.body.discountPercentage,
        startDate: new Date(req.body.startDate),
        expiryDate: new Date(req.body.expiryDate),
        minimumPurchase: req.body.minimumPurchase,
        maximumDiscount: req.body.maximumDiscount,
      };
      await couponCollection.findOneAndUpdate(
        { _id: req.params.id },
        { $set: updateFields }
      );
      res.json({ couponEdited: true });
    } else {
      res.json({ couponCodeExists: true });
    }
  } catch (error) {
    console.error(error);
  }
};

const updateCouponsStatus = async () => {
  try {
    const coupons = await couponCollection.find();

    coupons.forEach(async (coup) => {
      await couponCollection.updateOne(
        { _id: coup._id },
        {
          $set: {
            currentStatus:
              new Date(coup.expiryDate) >= new Date() &&
              new Date(coup.startDate) <= new Date(),
          },
        }
      );
    });
  } catch (error) {
    console.log(
      "error while updating the coupons current status through the coupons page :" +
        error
    );
  }
};

module.exports = { couponsPage, addCoupon, editCoupon };
