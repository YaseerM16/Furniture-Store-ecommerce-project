const adminRouter = require("express").Router();
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const manageOrderController = require("../controller/manageOrderController.js");
const upload = require("../services/multer.js");

const {
  loginValidationRules,
  adminloginValidation,
  isAdmin,
} = require("../middlewares/middleware");
const offersController = require("../controller/offersController.js");
const couponController = require("../controller/couponController.js");
const { salesReportPage } = require("../controller/salesReportController.js");

adminRouter.get("/adminLogin", adminController.adminLoginPage);
adminRouter.post(
  "/adminLogin",
  loginValidationRules(),
  adminloginValidation,
  adminController.adminLoginSubmit
);
adminRouter.get("/adimDashBoard", isAdmin, adminController.dashBoard);
adminRouter.get("/adminLogout", adminController.logout);

adminRouter.get("/usersList", isAdmin, adminController.userListing);
adminRouter.get("/blockUser", isAdmin, adminController.blockUser);
adminRouter.get("/unBlockUser", isAdmin, adminController.unBlockUser);

//Category Management
adminRouter.get("/categoryList", isAdmin, categoryController.categoryList);
adminRouter.post("/addCategory", isAdmin, categoryController.addCategory);
adminRouter.post("/editCategory", isAdmin, categoryController.editCategory);
adminRouter.get("/listCategory", isAdmin, categoryController.listCategory);
adminRouter.get("/unListCategory", isAdmin, categoryController.unListCategory);

//Product Management
adminRouter.get("/productList", isAdmin, productController.productList);
adminRouter.get("/addProduct", isAdmin, productController.addProductPage);
adminRouter.post(
  "/addProduct",
  isAdmin,
  upload.any(),
  productController.addProduct
);
adminRouter.get("/blockProduct", isAdmin, productController.blockProduct);
adminRouter.get("/unBlockProduct", isAdmin, productController.unBlockProduct);
adminRouter.get("/editProduct", isAdmin, productController.editProductPage);
adminRouter.post(
  "/editProduct/:id",
  upload.any(),
  productController.editProduct
);
adminRouter.post("/delete-image", isAdmin, productController.deleteImage);

//Order Management
adminRouter.get("/orderList", isAdmin, manageOrderController.orderListPage);
adminRouter.get(
  "/orderSummary",
  isAdmin,
  manageOrderController.orderSummaryDetails
);
adminRouter.post(
  "/update-order-status",
  isAdmin,
  manageOrderController.updateOrderStatus
);

///Offers Management
adminRouter.get("/product-offers-page", offersController.productOfferPage);
adminRouter.get("/category-offers-page", offersController.categoryOffersPage);
adminRouter.post(
  "/productOfferManagement/addOffer",
  offersController.addProductOffer
);
adminRouter.put(
  "/productOfferManagement/editOffer/:id",
  offersController.editProductOffer
);
adminRouter.post(
  "/categoryOfferManagement/addOffer",
  offersController.addCategoryOffer
);
adminRouter.put(
  "/categoryOfferManagement/editOffer/:id",
  offersController.editCategoryOffer
);

/// coupons

adminRouter.get("/coupons", couponController.couponsPage);
adminRouter.post("/couponManagement/addCoupon", couponController.addCoupon);
adminRouter.put(
  "/couponManagement/editCoupon/:id",
  couponController.editCoupon
);

/// Sales Report

adminRouter.get("/salesReport", salesReportPage);

module.exports = adminRouter;
