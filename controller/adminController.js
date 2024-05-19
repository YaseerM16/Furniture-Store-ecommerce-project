const adminCollection = require("../models/adminModel");
const userCollection = require("../models/userModel");

const adminLoginPage = (req, res) => {
  try {
    if (req.session.adminLog) {
      res.redirect("/adimDashBoard");
    } else {
      res.render("adminViews/login", {
        invalid: req.session.invalidCredentials,
        errors: false,
      });

      req.session.invalidCredentials = false;
      req.session.save();
    }
  } catch (error) {
    console.log("Error in showing the Admin login Page" + error);
  }
};

const adminLoginSubmit = async (req, res) => {
  try {
    let adminData = await adminCollection.findOne({
      email: req.session.loginEmail,
    });
    if (adminData) {
      if (
        adminData.email == req.session.loginEmail &&
        adminData.password == req.session.loginPass
      ) {
        req.session.adminLog = true;
        req.session.adminUser = adminData;
        req.session.save();
        res.redirect("/adimDashBoard");
      } else {
        req.session.invalidCredentials = true;
        res.redirect("/adminLogin");
      }
    } else {
      req.session.invalidCredentials = true;
      res.redirect("/adminLogin");
    }
  } catch (error) {
    console.error("Error while submitting the admin" + error);
  }
};

const dashBoard = async (req, res) => {
  try {
    let user;
    if (req.session.adminLog) {
      user = await adminCollection.findOne({ _id: req.session.adminUser._id });
    } else {
      user = {};
    }
    res.render("adminViews/home", { user: user });
  } catch (error) {
    console.error("Error in Renderind the Admin Home page" + error);
  }
};

const userListing = async (req, res) => {
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

    const userDetail = await userCollection.find().skip(skip).limit(limit);

    let pages;

    await userCollection
      .countDocuments()
      .then((count) => {
        pages = count;
      })
      .catch((err) => console.log("Error while counting the docment" + err));

    res.render("adminViews/userList", {
      userDet: userDetail,
      page: page,
      pages: Math.ceil(pages / limit),
      user: user,
    });
  } catch (err) {
    console.log("Error in User Listing Page" + err);
  }
};
const blockUser = async (req, res) => {
  try {
    await userCollection.updateOne(
      { _id: req.query.id },
      { $set: { isBlocked: false } }
    );
    res.send({ success: true });
  } catch (err) {
    console.log(err);
  }
};

const unBlockUser = async (req, res) => {
  try {
    await userCollection.updateOne(
      { _id: req.query.id },
      { $set: { isBlocked: true } }
    );
    res.send({ success: true });
  } catch (err) {
    console.log(err);
  }
};

const logout = (req, res) => {
  try {
    req.session.adminLog = false;
    req.session.save();

    res.redirect("/adminLogin");
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  adminLoginPage,
  adminLoginSubmit,
  dashBoard,
  userListing,
  blockUser,
  unBlockUser,
  logout,
};
