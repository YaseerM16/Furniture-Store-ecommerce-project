const adminCollection = require("../models/adminModel");
const userCollection = require("../models/userModel");

const adminLoginPage = (req, res) => {
  try {
    res.render("adminViews/login", {
      invalid: req.session.invalidCredentials,
      errors: false,
    });

    req.session.invalidCredentials = false;
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

const dashBoard = (req, res) => {
  try {
    res.render("adminViews/home");
  } catch (error) {
    console.error("Error in Renderind the Admin Home page" + error);
  }
};

const userListing = async (req, res) => {
  try {
    const userDetail = await userCollection.find();
    res.render("adminViews/userList", { userDet: userDetail });
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

module.exports = {
  adminLoginPage,
  adminLoginSubmit,
  dashBoard,
  userListing,
  blockUser,
  unBlockUser,
};
