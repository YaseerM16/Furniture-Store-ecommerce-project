const userCollection = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {
  hashPassword,
  sendOTP,
  verifyOTP,
  resendOTP,
} = require("../helpers/helper");
// const axios = require("axios");
// const https = require("https");

// const httpsAgent = new https.Agent({
//   rejectUnauthorized: false, // You can set this to true in production with proper certificates
//   secureProtocol: "TLSv1_2_method", // Specify the TLS version here
// });

const landingPage = (req, res) => {
  res.render("userViews/home");
};
const signUpPage = (req, res) => {
  res.render("userViews/signup", {
    errors: false,
    userExist: req.session.userExist,
    passwordMismatch: req.session.passwordMismatch,
  });
  req.session.userExist = false;
  req.session.passwordMismatch = false;
};

const loginPage = (req, res) => {
  try {
    console.log(req.session.invalidCredentials);
    res.render("userViews/login", {
      invalid: req.session.invalidCredentials,
      errors: false,
    });

    req.session.invalidCredentials = false;
  } catch (error) {
    console.log("Error in Viewing the Login Page" + error);
  }
};
const signUpSubmit = async (req, res) => {
  try {
    const { username, email, phonenumber, password, confirmPassword } =
      req.body;

    const existingUser = await userCollection.findOne({ email });

    if (existingUser) {
      req.session.userExist = true;
      res.redirect("/signUp");
    } else {
      if (password !== confirmPassword) {
        req.session.passwordMismatch = true;
        res.redirect("/signUp");
      }
      const hashedPassword = await hashPassword(password);

      let addUser = {
        username,
        email,
        phonenumber,
        password: hashedPassword,
        isBlocked: false,
      };
      req.session.newUser = addUser;
      sendOTP(addUser);

      res.render("userViews/otpPage");
    }
  } catch (err) {
    console.log(`Error in SignUp Registering : ${err}`);
  }
};

const loginSubmit = async (req, res) => {
  try {
    let exisitingUser = await userCollection.findOne({
      email: req.body.email,
    });
    if (exisitingUser) {
      console.log("User Exist");
      let passwordMatch = bcrypt.compareSync(
        req.body.password,
        exisitingUser.password
      );
      console.log(passwordMatch);
      if (passwordMatch) {
        req.session.currentUser = exisitingUser;
        res.redirect("/");
      } else {
        console.log("Password does not match");
        req.session.invalidCredentials = true;
        res.redirect("/logIn");
        console.log("called with invalidCredentials");
      }
    } else {
      console.log("User Does not exist");
      req.session.invalidCredentials = true;
      res.redirect("/logIn");
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  landingPage,
  signUpPage,
  signUpSubmit,
  loginPage,
  loginSubmit,
};
