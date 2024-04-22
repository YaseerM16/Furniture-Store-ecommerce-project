const userRouter = require("express").Router();
const accountController = require("../controller/accountController");
const cartController = require("../controller/cartController");
const userController = require("../controller/userController");
const orderController = require("../controller/orderController");
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
  isLogged,
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

//User Details
userRouter.get("/userDetails", accountController.userDetailsPage);
userRouter.post("/editProfile", accountController.profileEdit);

userRouter.get("/addressPage", accountController.addressPage);
userRouter.get("/addAddress", accountController.addAddressPage);
userRouter.post("/addAddress", accountController.addAddress);
userRouter.post("/editAddress", accountController.editAddress);
userRouter.delete("/deleteAddress", accountController.deleteAddress);

//Cart
userRouter.post("/addToCart", cartController.addToCart);
userRouter.get("/cartPage", cartController.cartPage);
userRouter.get("/increaseQty", cartController.quantityIncBtn);
userRouter.get("/cartIncBtn", cartController.cartIncBtn);
userRouter.post("/selectAddress", cartController.addressCheckOutPage);
userRouter.get("/RedirectPaymentPage", cartController.redirecPaymentMethod);
userRouter.get("/payMethodPage", cartController.paymentMethodPage);
userRouter.get("/checkoutPage", cartController.checkoutPage);
userRouter.get("/placeOrder", cartController.placeOrder);

//Orders
userRouter.get("/myOrdersPage", orderController.orderPage);

module.exports = userRouter;
