const adminRouter = require("express").Router();
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const upload = require("../services/multer.js");

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
adminRouter.get("/logout", adminController.logout);

adminRouter.get("/usersList", adminController.userListing);
adminRouter.get("/blockUser", adminController.blockUser);
adminRouter.get("/unBlockUser", adminController.unBlockUser);

//Category Management
adminRouter.get("/categoryList", categoryController.categoryList);
adminRouter.post("/addCategory", categoryController.addCategory);
adminRouter.post("/editCategory", categoryController.editCategory);
adminRouter.get("/listCategory", categoryController.listCategory);
adminRouter.get("/unListCategory", categoryController.unListCategory);

//Product Management
adminRouter.get("/productList", productController.productList);
adminRouter.get("/addProduct", productController.addProductPage);
adminRouter.post("/addProduct", upload.any(), productController.addProduct);
adminRouter.get("/blockProduct", productController.blockProduct);
adminRouter.get("/unBlockProduct", productController.unBlockProduct);
adminRouter.get("/editProduct", productController.editProductPage);
adminRouter.post(
  "/editProduct/:id",
  upload.any(),
  productController.editProduct
);
adminRouter.post("/delete-image", productController.deleteImage);

module.exports = adminRouter;
