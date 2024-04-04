const userRouter = require("express").Router();
const userController = require("../controller/userController");
const { resendOTP, verifyOTP } = require("../helpers/helper");
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
userRouter.get("/resend-otp", resendOTP);
userRouter.post("/verify-otp", verifyOTP);

//LogIn Routes
userRouter.get("/logIn", userController.loginPage);
userRouter.post(
  "/logIn",
  loginValidationRules(),
  loginValidation,
  userController.loginSubmit
);
userRouter.get("/forget-password");
//OTP Routes
// userRouter.post("/sent-otp", userController.sendOTP);
// userRouter.post("/verify-otp", userController.verifyOTP);

module.exports = userRouter;
