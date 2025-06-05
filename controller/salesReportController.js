const adminCollection = require("../models/adminModel");
const orderCollection = require("../models/orderModel");
const puppeteer = require("puppeteer");
const exceljs = require("exceljs");
const AppError = require("../middlewares/errorHandling");
// const { invoicePdf } = require("../services/invoicePdf");
const PDFDocument = require("pdfkit");

const invoicePdf = (res, salesData) => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  doc.pipe(res);

  doc.fontSize(16).text("Sales Report", { align: "center" });
  doc.moveDown();

  // Header titles
  const headers = [
    "Order #",
    "User",
    "Date",
    "Product",
    "Offer",
    "Qty",
    "Before Offer",
    "Total",
    "Payment",
    "Status",
    "Coupon",
    "Before Coupon",
    "Final",
  ];

  const startX = doc.x;
  const rowHeight = 20;
  let currentY = doc.y;

  // Fit within ~570px width
  const colWidths = [50, 50, 45, 80, 35, 25, 55, 50, 40, 40, 40, 55, 55]; // Adds to ~555

  // Header Row
  headers.forEach((header, i) => {
    doc
      .fontSize(7.5)
      .text(
        header,
        startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
        currentY,
        {
          width: colWidths[i],
          align: "left",
        }
      );
  });
  currentY += rowHeight;
  console.log("One Sale: ", salesData);

  // Row Data
  salesData.forEach((order) => {
    order.cartData.forEach((item) => {
      const product = item.productId;
      let beforeCoupRate = null;
      let appliedCoupon = null;
      if (order.couponApplied) {
        beforeCoupRate = Math.round(
          order.grandTotalCost /
            (1 - order.couponApplied.discountPercentage / 100)
        );
        appliedCoupon = order.couponApplied?.discountPercentage;
      }

      const row = [
        order.orderId,
        order.userId?.username || "N/A",
        new Date(order.orderDate).toLocaleDateString(),
        product?.productName || "N/A",
        product?.productOffer || "Nil",
        item.productQuantity,
        `Rs.${item.totalCostPerProduct || 0}`,
        `Rs.${item.totalCostPerProduct || 0}`,
        order.paymentType,
        order.orderStatus,
        appliedCoupon ? `${appliedCoupon} %` : "Nil",
        beforeCoupRate ? `Rs.${beforeCoupRate}` : 0,
        `Rs.${order.grandTotalCost || 0}`,
      ];

      row.forEach((text, i) => {
        doc
          .fontSize(7)
          .text(
            String(text),
            startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
            currentY,
            {
              width: colWidths[i],
              align: "left",
            }
          );
      });

      currentY += rowHeight;

      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = doc.y;
      }
    });
  });

  doc.end();
};

const SalesReportGet = async (req, res, next) => {
  try {
    const user = await adminCollection.findOne({
      _id: req.session.adminUser._id,
    });

    let startDate, endDate;

    if (req.session.startDate && req.session.endDate) {
      startDate = req.session.startDate;
      endDate = req.session.endDate;
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
    }
    let startDate2, endDate2;
    if (req.session.startDate2 && req.session.endDate2) {
      startDate2 = new Date(req.session.startDate2);
      endDate2 = new Date(req.session.endDate2);
    }

    const page = Number(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    var salesDetails =
      (req.session.salesDetails && req.session.salesDetails.length > 0) ||
      (await orderCollection
        .find({
          orderDate: { $gte: startDate, $lte: endDate },
          orderStatus: "Delivered",
        })
        .sort({ orderDate: -1 })
        .populate({
          path: "cartData.productId",
          model: "products",
          as: "productDetails",
        })
        .populate({
          path: "userId",
          model: "users",
          as: "userDetails",
        })
        .populate({
          path: "couponApplied",
          model: "coupons",
          as: "couponDetails",
        })
        .skip(skip)
        .limit(limit));

    let totalSum = [];
    let total = [];
    let totalSum1 = [];
    let total2 = [];
    for (i = 0; i < salesDetails.length; i++) {
      totalSum = salesDetails[i].cartData.map((item) => item.productprice);
      total.push(totalSum);
      totalSum1 = salesDetails[i].cartData.map((item) => item.priceBeforeOffer);
      total2.push(totalSum1);
    }

    req.session.sreportLen = salesDetails.length;

    const products = await orderCollection
      .find({
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: "Delivered",
      })
      .populate("userId")
      .sort({ _id: -1 });
    const totalcount = products.length;
    console.log("Totalcount: ", products.length);

    res.render("adminViews/salesReport", {
      Sreports: salesDetails,
      totalPages: Math.ceil(req.session.sreportLen / limit),
      user,
      orders: [],
      page: page,
      pages: Math.ceil(totalcount / limit),
      totalcount,
      startDate2,
      endDate2,
      products,
      success: true,
    });
  } catch (error) {
    next(new AppError(error, 500));
  }
};

const salesReportDownloadPDF = async (req, res, next) => {
  try {
    // let { startDate, endDate } = req.query;

    let startDate, endDate;

    if (req.session.startDate && req.session.endDate) {
      startDate = req.session.startDate;
      endDate = req.session.endDate;
    } else {
      startDate = new Date(startDate);
      endDate = new Date(endDate);
    }

    const salesData = await orderCollection
      .find({
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: "Delivered",
      })
      .populate({
        path: "cartData.productId",
        model: "products",
        as: "productDetails",
      })
      .populate({
        path: "userId",
        model: "users",
        as: "userDetails",
      })
      .populate({
        path: "couponApplied",
        model: "coupons",
        as: "couponDetails",
      });

    if (!salesData.length) {
      return res
        .status(404)
        .send("No sales data found for the selected period.");
    }

    invoicePdf(res, salesData);
  } catch (error) {
    if (!res.headersSent) {
      return next(new AppError(error.message || "Download failed", 500));
    } else {
      console.error("Error after headers sent:", error.message);
    }
  }
};

const formatDate = (date) => {
  // Implement your date formatting function here
  return date.toISOString().split("T")[0]; // Example implementation
};

const filterDate = async (req, res, next) => {
  try {
    if (req.query.filterDateFrom && req.query.filterDateTo) {
      req.session.startDate = req.query.filterDateFrom;
      req.session.endDate = req.query.filterDateTo;
      return await SalesReportGet(req, res, next);
    }
  } catch (error) {
    console.log(error);
    next(new AppError("Somthing went Wrong", 500));
  }
};

const salesReportDownload = async (req, res, next) => {
  try {
    let startDate, endDate;
    if (
      req.session.filterDates?.datevalues?.startDate &&
      req.session.filterDates?.datevalues?.endDate
    ) {
      startDate = req.session.filterDates.datevalues.startDate;
      endDate = req.session.filterDates.datevalues.endDate;
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
    }

    let salesData = await orderCollection
      .find({
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: "Delivered",
      })
      .populate({
        path: "cartData.productId",
        model: "products",
        as: "productDetails",
      })
      .populate({
        path: "userId",
        model: "users",
        as: "userDetails",
      })
      .populate({
        path: "couponApplied",
        model: "coupons",
        as: "couponDetails",
      });

    if (!salesData || !Array.isArray(salesData)) {
      console.error("salesData is undefined or not an array");
    }

    salesData = salesData.map((v) => {
      v.orderDateFormatted = formatDate(v.orderDate);
      return v;
    });
    const workBook = new exceljs.Workbook();
    const sheet = workBook.addWorksheet("book");
    sheet.columns = [
      {
        header: "Order Number",
        key: "orderNumber",
        width: 15,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "UserName",
        key: "userName",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Order Date",
        key: "orderDate",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Products",
        key: "products",
        width: 30,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Product Offer",
        key: "productOffer",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Quantity",
        key: "quantity",
        width: 15,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Before Offer",
        key: "beforeOffer",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Total Cost",
        key: "totalCost",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Payment Method",
        key: "paymentMethod",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Status",
        key: "status",
        width: 15,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Coupons",
        key: "coupons",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Before Coupon",
        key: "beforeCoupon",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Ordered Price",
        key: "orderedPrice",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
    ];

    let currentRow = 1;

    salesData.forEach((order) => {
      order.cartData.forEach((cartItem, index) => {
        const row = sheet.addRow([
          index === 0 ? order._id : "",
          index === 0 ? order.userId.username : "",
          index === 0 ? order.orderDateFormatted : "",
          cartItem.productId.productName,
          cartItem.productId.productOfferPercentage
            ? `${cartItem.productId.productOfferPercentage}%`
            : "Nil",
          cartItem.productQuantity,
          `Rs.${
            cartItem.totalCostPerProduct +
            (cartItem.productId.priceBeforeOffer * cartItem.productQuantity -
              cartItem.totalCostPerProduct)
          }`,
          `Rs.${cartItem.totalCostPerProduct}`,
          index === 0 ? order.paymentType : "",
          index === 0 ? order.orderStatus : "",
          index === 0
            ? order.couponApplied
              ? `${order.couponApplied.discountPercentage}%`
              : "Nil"
            : "",
          index === 0
            ? order.couponApplied
              ? `Rs.${Math.round(
                  order.grandTotalCost /
                    (1 - order.couponApplied.discountPercentage / 100)
                )}`
              : "Nil"
            : "",
          index === 0 ? `Rs.${order.grandTotalCost}` : "",
        ]);
      });
    });
    let startIndex = 1;
    let endIndex;
    salesData.forEach((order, orderIndex) => {
      startIndex += 1;
      endIndex = startIndex + order.cartData.length - 1;
      sheet.mergeCells(`A${startIndex}:A${endIndex}`);
      sheet.mergeCells(`B${startIndex}:B${endIndex}`);
      sheet.mergeCells(`C${startIndex}:C${endIndex}`);
      sheet.mergeCells(`I${startIndex}:I${endIndex}`);
      sheet.mergeCells(`J${startIndex}:J${endIndex}`);
      sheet.mergeCells(`K${startIndex}:K${endIndex}`);
      sheet.mergeCells(`L${startIndex}:L${endIndex}`);
      sheet.mergeCells(`M${startIndex}:M${endIndex}`);

      sheet.getCell(`A${startIndex}:M${endIndex}`).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      startIndex += order.cartData.length - 1;
    });

    const totalOrders = salesData.length;
    const totalSales = salesData.reduce(
      (total, sale) => total + sale.grandTotalCost,
      0
    );
    const totalDiscount = salesData.reduce((total, sale) => {
      let discountAmount = sale.cartData.reduce((discount, cartItem) => {
        let productPrice = cartItem.productId.productPrice;
        let priceBeforeOffer = cartItem.productId.priceBeforeOffer;
        let discountPercentage = cartItem.productId.productOfferPercentage || 0;
        let actualAmount = productPrice * cartItem.productQuantity;
        let paidAmount =
          actualAmount - (actualAmount * discountPercentage) / 100;
        return discount + (actualAmount - paidAmount);
      }, 0);
      return total + discountAmount;
    }, 0);

    sheet.addRow({});
    sheet.addRow({ "Total Orders": totalOrders });
    sheet.addRow({ "Total Sales": "₹" + totalSales });
    sheet.addRow({ "Total Discount": "₹" + totalDiscount });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=salesReport.xlsx"
    );

    await workBook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(new AppError(error, 500));
  }
};

const removeAllFillters = async (req, res, next) => {
  try {
    req.session.salesDetails = null;
    req.session.startDate2 = null;
    req.session.endDate2 = null;
    res.redirect("/admin/salesReport");
  } catch (error) {
    next(new AppError(error, 500));
  }
};

const filterOptions = async (req, res, next) => {
  try {
    const { option } = req.query;

    let startDate, endDate;

    if (option === "month") {
      endDate = new Date();
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);
    } else if (option === "week") {
      let currentDate = new Date();
      let currentDay = currentDate.getDay();
      let diff = currentDate.getDate() - currentDay - 7;
      startDate = new Date(currentDate.setDate(diff));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (option === "year") {
      let today = new Date();
      endDate = today;
      startDate = new Date();
      startDate.setFullYear(today.getFullYear() - 1);
    }
    req.session.startDate = startDate;
    req.session.endDate = endDate;

    return await SalesReportGet(req, res, next);
  } catch (error) {
    next(new AppError("Somthing went Wrong", 500));
  }
};

module.exports = {
  SalesReportGet,
  salesReportDownloadPDF,
  salesReportDownload,
  filterDate,
  filterOptions,
  removeAllFillters,
};
