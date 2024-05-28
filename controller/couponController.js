const adminCollection = require("../models/adminModel");
const couponCollection = require("../models/couponModel");
const crypto = require("crypto");

const couponsPage = async (req, res) => {
  try {
    let user = await adminCollection.findOne({
      _id: req.session.adminUser._id,
    });

    await updateCouponsStatus();

    const coupons = await couponCollection.find({ isDelete: false });

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
    let couponCode;
    let existinCoupon;
    do {
      couponCode = crypto.randomBytes(6).toString("hex"); // generate a random hex string
      existingCoupon = await couponCollection.findOne({
        couponCode: couponCode,
      });
    } while (existingCoupon);
    if (!existingCoupon) {
      const currentDate = new Date();
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.expiryDate);

      let currentStatusVal = startDate <= currentDate && currentDate <= endDate;
      await couponCollection.insertMany([
        {
          couponCode,
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
    let existCoupon = await couponCollection.findOne({
      _id: req.body.couponId,
    });
    if (existCoupon && existCoupon._id != req.body.couponId) {
      res.json({ couponCodeExists: true });
    } else {
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
    }
  } catch (error) {
    console.error(error);
  }
};

const deleteCounpon = async (req, res) => {
  try {
    const deleteCoupon = await couponCollection.findByIdAndUpdate(
      req.query.couponID,
      {
        $set: { isDelete: true },
      },
      {
        new: true, // return the updated document
      }
    );
    if (deleteCoupon.isDelete) {
      res.send({ isDeleted: true });
    } else {
      res.send({ couponNotFound: true });
    }
  } catch (error) {
    console.log("Error while Delete the coupon in the admin side: " + error);
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

module.exports = {
  couponsPage,
  addCoupon,
  editCoupon,
  deleteCounpon,
  updateCouponsStatus,
};
