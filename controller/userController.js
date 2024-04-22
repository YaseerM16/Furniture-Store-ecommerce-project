const userCollection = require("../models/userModel");
const productCollection = require("../models/productModel");
const cartCollection = require("../models/cartModel");

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
  try {
    if (req.session.logged) {
      res.render("userViews/home", { user: req.session.currentUser });
    } else {
      res.render("userViews/home", { user: null });
    }
  } catch (error) {
    console.log("Error While Rendering the Home Page" + error);
  }
};

const signUpPage = (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      res.render("userViews/signup", {
        errors: false,
        userExist: req.session.userExist,
        passwordMismatch: req.session.passwordMismatch,
      });
      req.session.userExist = false;
      req.session.passwordMismatch = false;
    }
  } catch (error) {
    console.log("Error in showing Signup page" + error);
  }
};

const loginPage = (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      res.render("userViews/login", {
        invalid: req.session.invalidCredentials,
        errors: false,
      });
    }
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
      req.session.save();
      req.session.passed = true;
      res.redirect("/sendOTP");
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
      let passwordMatch = bcrypt.compareSync(
        req.body.password,
        exisitingUser.password
      );
      if (passwordMatch) {
        req.session.currentUser = exisitingUser;
        req.session.logged = true;
        req.session.save();
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

// const produects = async (req, res) => {
//   try {
//     const productDetails = await productCollection.find({ isListed: true });
//     res.render("userViews/products", {
//       userLogged: req.session.logged,
//       productDet: productDetails,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// };

const products = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 9;
  const skip = (page - 1) * limit;

  try {
    const products = await productCollection
      .find({ isListed: true })
      .populate("parentCategory")
      .skip(skip)
      .limit(limit);

    let pages;

    await productCollection
      .countDocuments()
      .then((count) => {
        pages = count;
      })
      .catch((err) => console.log("Error while counting the docment" + err));

    // pages: Math.ceil(productCollection.countDocuments() / limit)

    res.render("userViews/products", {
      title: "Products",
      userLogged: req.session.logged,
      productDet: products,
      page: page,
      pages: Math.ceil(pages / limit),
    });
  } catch (error) {
    // res.status(500).send(error);
    console.log(error);
  }
};

const productDetail = async (req, res) => {
  try {
    const existInCart = await cartCollection.findOne({
      productId: req.query.id,
    });
    const currentProduct = await productCollection
      .findOne({
        _id: req.query.id,
      })
      .populate("parentCategory");
    if (existInCart) {
      const availLimit = parseInt(existInCart.productQuantity);
      res.render("userViews/productDetails", {
        _id: req.body.user_id,
        user: req.session.logged,
        currentProduct,
        productQtyLimit: availLimit,
      });
    } else {
      res.render("userViews/productDetails", {
        _id: req.body.user_id,
        user: req.session.logged,
        currentProduct,
        productQtyLimit: 0,
      });
    }
  } catch (error) {
    console.log("Error while showing the Product Detail" + error);
  }
};

const logout = (req, res) => {
  try {
    req.session.logged = false;
    req.session.currentUser = false;
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  landingPage,
  signUpPage,
  signUpSubmit,
  loginPage,
  loginSubmit,
  products,
  productDetail,
  logout,
};
