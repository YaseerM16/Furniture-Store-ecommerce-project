const adminCollection = require("../models/adminModel");

const salesReportPage = async (req, res) => {
  try {
    user = await adminCollection.findOne({ _id: req.session.adminUser._id });
    res.render("adminViews/salesReport", {
      orders: [],
      user,
      page: 1,
      pages: 2,
    });
  } catch (error) {
    console.log(
      "Error While rendering the Sales report page in the admin side :" + error
    );
  }
};

module.exports = { salesReportPage };
