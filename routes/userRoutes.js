const userRouter = require("express").Router();
const userController = require("../controller/userController");
const {
  resendOTP,
  verifyOTP,
  retryOTP,
  sendOTP,
  otpSucessPage,
} = require("../helpers/helper");
const {
  signupValidationRules,
  signupValidation,
  loginValidationRules,
  loginValidation,
} = require("../middlewares/middleware");

//sign-up Routes
userRouter.get("/", userController.landingPage);
userRouter.get("/signUp", userController.signUpPage);
userRouter.post(
  "/signUpSubmit",
  signupValidationRules(),
  signupValidation,
  userController.signUpSubmit
);
userRouter.get("/sendOTP", sendOTP);
userRouter.get("/resend-otp", resendOTP);
userRouter.post("/verify-otp", verifyOTP);
userRouter.get("/retry-otp", retryOTP);
userRouter.get("/otpSuccess", otpSucessPage);

//LogIn Routes
userRouter.get("/logIn", userController.loginPage);
userRouter.post(
  "/logIn",
  loginValidationRules(),
  loginValidation,
  userController.loginSubmit
);
userRouter.get("/logout", userController.logout);
userRouter.get("/forget-password");

//Product
userRouter.get("/products", userController.products);
userRouter.get("/singleProduct", userController.productDetail);

module.exports = userRouter;
