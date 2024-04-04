const adminRouter = require("express").Router();
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const {
  loginValidationRules,
  adminloginValidation,
} = require("../middlewares/middleware");

adminRouter.get("/adminLogin", adminController.adminLoginPage);
adminRouter.post(
  "/adminLogin",
  loginValidationRules(),
  adminloginValidation,
  adminController.adminLoginSubmit
);
adminRouter.get("/adimDashBoard", adminController.dashBoard);

adminRouter.get("/usersList", adminController.userListing);
adminRouter.get("/blockUser", adminController.blockUser);
adminRouter.get("/unBlockUser", adminController.unBlockUser);
adminRouter.get("/categoryList", categoryController.categoryList);

module.exports = adminRouter;
