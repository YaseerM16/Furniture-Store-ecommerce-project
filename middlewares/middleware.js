const { check, validationResult } = require("express-validator");

const signupValidationRules = () => [
  check("username")
    .exists()
    .withMessage("Username is required")
    .isLength({ min: 5 })
    .withMessage("Username must be at least 5 characters"),
  check("email")
    .exists()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
  check("phonenumber")
    .exists()
    .withMessage("Phone is required")
    .isNumeric()
    .withMessage("Phone must be numbers only")
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone must be exactly 10 digits"),
  check("password")
    .exists()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  check("confirmPassword")
    .exists()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidationRules = () => [
  check("email")
    .exists()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
  check("password")
    .exists()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = (req, res, next) => {
  const errorsObj = validationResult(req);
  if (!errorsObj.isEmpty()) {
    req.session.errors = errorsObj.array();
    res.render("userViews/login", {
      errors: errorsObj.array(),
      invalid: false,
    });
  }
  next();
};
const adminloginValidation = (req, res, next) => {
  const errorsObj = validationResult(req);
  if (!errorsObj.isEmpty()) {
    req.session.errors = errorsObj.array();
    res.render("adminViews/login", {
      errors: errorsObj.array(),
      invalid: false,
    });
  }
  req.session.loginEmail = req.body.email;
  req.session.loginPass = req.body.password;
  next();
};

const signupValidation = (req, res, next) => {
  const errorsObj = validationResult(req);
  if (!errorsObj.isEmpty()) {
    req.session.errors = errorsObj.array();
    res.render("userViews/signup", {
      errors: errorsObj.array(),
      userExist: false,
      passwordMismatch: false,
    });
    console.log("this is called after the render in signup error");
  }
  next();
};

const isLogged = (req, res, next) => {
  try {
    if (req.session.logged) {
      next();
    } else {
      res.redirect("/logIn");
    }
  } catch (error) {
    console.log("Error while checking the logged middleware " + error);
  }
};

module.exports = {
  signupValidationRules,
  signupValidation,
  loginValidationRules,
  loginValidation,
  adminloginValidation,
  isLogged,
};
