const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Otp = require("../models/otpModel");
const nodemailer = require("nodemailer");
const userCollection = require("../models/userModel");
const productCollection = require("../models/productModel");
const categoryCollection = require("../models/categoryModel");
const productOfferCollection = require("../models/productOfferModel");
const categoryOffercollection = require("../models/categoryOfferModel");
const walletCollection = require("../models/walletModel");

const hashPassword = async (password) => {
  try {
    const salt = 10;
    const hashedPassword = await bcrypt.hashSync(password, salt);
    return hashedPassword;
  } catch (err) {
    console.log(`Error in Hashing the Password: ${err}`);
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASS,
  },
});
const otpPage = (req, res) => {
  try {
    res.render("userViews/otpPage", {
      inValid: false,
    });
  } catch (error) {
    console.log("Error while Rendering the Otp Page : " + error);
  }
};
const sendOTP = async (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      const { email } = req.session.newUser;

      // Check if email is already registered
      // const existingUser = await Otp.findOne({ email });
      // if (existingUser) {
      //   req.session.userExist = true;
      //   res.redirect("/signUp");
      // } else {
      //   // Generate OTP
      // }
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Send email with OTP
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "OTP for registration",
        html: `<p>Your OTP is: <b>${otp}</b></p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return { message: "Error sending email" };
        }
        console.log(`Email sent: ${info.response}`);

        // Save OTP to the database
        const newOtp = new Otp({ email, otp });
        newOtp.save();
        req.session.succeed = true;
        res.redirect("/otpPage");
      });
    }
  } catch (error) {
    console.log("Error while sending OTP" + error);
  }
};
const retryOtp = async (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      const { email } = req.session.newUser;

      // Check if email is already registered
      // const existingUser = await Otp.findOne({ email });
      // if (existingUser) {
      //   req.session.userExist = true;
      //   res.redirect("/signUp");
      // } else {
      //   // Generate OTP
      // }
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Send email with OTP
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "OTP for registration",
        html: `<p>Your OTP is: <b>${otp}</b></p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return { message: "Error sending email" };
        }
        console.log(`Email sent: ${info.response}`);

        // Save OTP to the database
        const newOtp = new Otp({ email, otp });
        newOtp.save();
        req.session.succeed = true;
        res.redirect("/otpPage");
      });
    }
  } catch (error) {
    console.log(
      "Error while Attempt to send the OTP through Retry button in Invalid OTP page :" +
        error
    );
  }
};
// const sendOTPSecond = e;
const sendForgetPassOtp = async (req, res) => {
  try {
    const email = req.session.forgetEmail;
    const otp = Math.floor(100000 + Math.random() * 900000);

    console.log(email);
    console.log(req.session.forgetEmail);
    if (!email) {
      console.log("Error: No email address found in session");
      return res
        .status(400)
        .send({ message: "Error: No email address found in session" });
    }

    // Send email with OTP
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "OTP for registration",
      html: `<p>Your OTP is: <b>${otp}</b></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return { message: "Error sending email" };
      }
      console.log(`Email sent: ${info.response}`);

      // Save OTP to the database
      const newOtp = new Otp({ email, otp });
      newOtp.save();
      req.session.succeed = true;
      res.render("userViews/forgetOtpPage", {
        inValid: false,
      });
    });
  } catch (error) {
    console.log("Error while sending OTP to the Forget password Page:" + error);
  }
};

const verifyForgetOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.forgetEmail;
    const existingOtp = await Otp.findOne({ email, otp });
    if (!existingOtp || existingOtp.createdAt < Date.now() - 5 * 60 * 1000) {
      res.render("userViews/forgetOtpInvalid");
    } else {
      await Otp.deleteOne({ email, otp });

      // Add user to the database
      // You can define youruser model and add the user here

      res.render("userViews/changePassword", {
        errors: false,
        userExist: req.session.userExist,
        passwordMismatch: req.session.passwordMismatch,
      });
      req.session.userExist = false;
      req.session.passwordMismatch = false;
    }
  } catch (error) {
    console.log(
      "Erro while Verifying the OTP form the Forget Passerword generated OTP " +
        error
    );
  }
};

const updatePassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    console.log(req.session.forgetEmail);
    if (password !== confirmPassword) {
      req.session.passwordMismatch = true;
      res.redirect("/");
    } else {
      const hashedPassword = await hashPassword(password);
      const forgetEmail = req.session.forgetEmail;
      const user = await userCollection.findOneAndUpdate(
        { email: forgetEmail },
        { $set: { password: hashedPassword } },
        { new: true }
      );
      if (!user) {
        console.log("User not found");
        res.status(404).send({ message: "User not found" });
      } else {
        console.log("Password updated successfully");

        res.render("userViews/changePassSuccess");
      }
    }
  } catch (error) {
    console.log(
      "ERROR while updating the password through the forget password " + error
    );
  }
};

const verifyOTP = async (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      if (req.session.verified) {
        res.redirect("/otpSuccess");
      } else {
        const { otp } = req.body;
        const {
          username,
          email,
          phonenumber,
          password,
          isBlocked,
          referralCode,
        } = req.session.newUser;

        // Check if OTP is valid
        const existingOtp = await Otp.findOne({ email, otp });
        if (
          !existingOtp ||
          existingOtp.createdAt < Date.now() - 5 * 60 * 1000
        ) {
          res.render("userViews/otpInvalid");
        } else {
          await Otp.deleteOne({ email, otp });

          // Add user to the database
          // You can define your user model and add the user here
          let addUser = new userCollection({
            username,
            email,
            phonenumber,
            password,
            isBlocked,
            referralCode: crypto.randomBytes(10).toString("hex"),
          });

          let savedUser = await addUser.save();
          const userId = savedUser._id;
          await walletCollection.create({
            userId,
          });

          if (referralCode) {
            console.log(req.session.newUser.referralCode);
            const transactionDate = new Date();
            const transactionAmount = 100;
            const transactionType = "credited";
            const referrer = await userCollection.findOne({
              referralCode: req.session.newUser.referralCode,
            });
            const secondper = await walletCollection.findOneAndUpdate(
              { userId: referrer._id },
              {
                $inc: { walletBalance: 100 },
                $push: {
                  walletTransaction: {
                    transactionDate: transactionDate,
                    transactionAmount: transactionAmount,
                    transactionType: transactionType,
                    transactionMethod: "Referral",
                  },
                },
              },

              { new: true }
            );
            const firstPer = await walletCollection.findOneAndUpdate(
              { userId: userId },
              {
                $inc: { walletBalance: 100 },
                $push: {
                  walletTransaction: {
                    transactionDate: transactionDate,
                    transactionAmount: transactionAmount,
                    transactionType: transactionType,
                    transactionMethod: "Referral",
                  },
                },
              },

              { new: true }
            );
          }

          req.session.verified = true;
          req.session.passed = false;
          res.redirect("/otpSuccess");
        }
      }
    }
  } catch (error) {
    console.log("Error while verifying the OTP " + error);
  }

  //success Page

  // Delete OTP from the database
};
const otpSucessPage = (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      if (req.session.verified) {
        res.render("userViews/otpSuccess");
      }
    }
  } catch (error) {
    console.log("error in showing the OTP Success Page" + error);
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.newUser;
    console.log(email);

    // Delete existing OTP from the database
    const deleteRes = await Otp.deleteOne({ email });
    if (deleteRes.deletedCount > 0) {
      console.log("Existing OTP deleted successfully");

      // Send new OTP
      await sendOTP(req.session.newUser);
    } else {
      console.log("No existing OTP found to delete");
      res.status(404).send({ error: "No existing OTP found" });
    }
    // Send new OTP
  } catch (error) {
    console.log("Error while Resend the OTP in User Side:" + error);
  }
};

const forgetResendOTP = async (req, res) => {
  try {
    const email = req.session.forgetEmail;

    // Delete existing OTP from the database
    const deleteResult = await Otp.deleteOne({ email: email });

    if (deleteResult.deletedCount > 0) {
      console.log("Existing OTP deleted successfully");

      // Send new OTP
      await sendForgetPassOtp(req, res);
    } else {
      console.log("No existing OTP found to delete");
      res.status(404).send({ error: "No existing OTP found" });
    }
  } catch (error) {
    console.log("Error in forgetResendOTP:", error);
    res.status(500).send({ error: "Error resending OTP" });
  }
};

const retryOTP = async (req, res) => {
  console.log("retry OTp function is calling");
  const { email } = req.session.newUser;
  console.log(email);

  // Delete existing OTP from the database
  await Otp.deleteOne({ email });

  // Send new OTP
  sendOTP(req.session.newUser);

  res.render("userViews/otpPage", { inValid: false });
};

function calcStatus(orderCancelUpdate) {
  const productStatusValues = orderCancelUpdate.cartData.map(
    (item) => item.productStatus
  );

  const allCancelled = productStatusValues.every((val) => val === "Cancelled");
  const nonCancelledCount = productStatusValues.filter(
    (val) => val !== "Cancelled"
  ).length;

  const differentStatus = productStatusValues.find(
    (val) => val !== "Cancelled"
  );

  const oneCancelledAndRestSame = productStatusValues
    .filter((val) => val !== "Cancelled")
    .every((val) => val === productStatusValues[0]);

  const allSameStatus = productStatusValues.every(
    (val, _, arr) => val === arr[0]
  );

  return {
    allCancelled,
    nonCancelledCount,
    differentStatus,
    allSameStatus,
    oneCancelledAndRestSame,
    productStatusValues,
  };
}

///  Product Offer Apply  ///

const applyProductOffer = async (action) => {
  try {
    // updating the currentStatus field of productOfferCollection by checking with the current date
    let productOfferData = await productOfferCollection.find();
    productOfferData.forEach(async (v) => {
      await productOfferCollection.updateOne(
        { _id: v._id },
        {
          $set: {
            currentStatus: v.endDate >= new Date() && v.startDate <= new Date(),
          },
        }
      );
    });

    let productData = await productCollection.find();
    productData.forEach(async (v) => {
      let offerExists = await productOfferCollection.findOne({
        productId: v._id,
        currentStatus: true,
      });

      if (offerExists) {
        offerExistsAndActiveFn(v, offerExists, action);
      }

      let offerExistsAndInactive = await productOfferCollection.findOne({
        productId: v._id,
        currentStatus: false,
      });

      if (offerExistsAndInactive) {
        offerExistsAndInactiveFn(v, action);
      }
    });
  } catch (error) {
    console.error(error);
  }
};
async function offerExistsAndActiveFn(v, offerExists, action) {
  const { productOfferPercentage: newOfferPercentage } = offerExists;
  const currentOfferPercentage = v.productOfferPercentage;
  const greaterOfferPercentage = Math.max(
    currentOfferPercentage,
    newOfferPercentage
  );

  let productPrice;
  if (action === "addOffer") {
    productPrice = Math.round(
      v.productPrice * (1 - greaterOfferPercentage * 0.01)
    );
    console.log("applying add : ");
    console.log(greaterOfferPercentage);
    console.log(productPrice);
    await productCollection.updateOne(
      { _id: v._id },
      {
        $set: {
          productPrice,
          productOfferId: offerExists._id,
          productOfferPercentage: greaterOfferPercentage,
          priceBeforeOffer: v.productPrice,
        },
      }
    );
  } else if (action === "editOffer" || action === "landingPage") {
    productPrice = Math.round(
      v.priceBeforeOffer * (1 - greaterOfferPercentage * 0.01)
    );
    console.log("applying edit : ");
    console.log(greaterOfferPercentage);
    console.log(productPrice);
    await productCollection.updateOne(
      { _id: v._id },
      {
        $set: {
          productPrice,
          productOfferId: offerExists._id,
          productOfferPercentage: greaterOfferPercentage,
        },
      }
    );
  }
}

async function offerExistsAndInactiveFn(v, action) {
  if (action == "editOffer" || "landingPage") {
    console.log("Offer removing also happening:");
    console.log(v.priceBeforeOffer);
    let productPrice = v.priceBeforeOffer;
    await productCollection.updateOne(
      { _id: v._id },
      {
        $set: {
          productPrice,
          productOfferId: null,
          productOfferPercentage: null,
        },
      }
    );
  }
}
const formatDate = (date, format = "MonDDYYYY") => {
  const dateObject = new Date(date);
  if (format == "MonDDYYYY") {
    var options = { day: "2-digit", month: "short", year: "numeric" };
  } else if (format == "yyyy-MM-dd") {
    var options = { year: "numeric", month: "2-digit", day: "2-digit" };
  } else if (format == "YYYY-MM-DD") {
    return dateObject.toISOString().split("T")[0];
  }

  return dateObject.toLocaleDateString("en-US", options);
};

const applyOffers = async () => {
  try {
    let productOfferCollectionData = await productOfferCollection.find({
      currentStatus: true,
    });
    let categoryOffercollectionData = await categoryOffercollection.find({
      currentStatus: true,
    });

    // Convert categoryOffercollection and productOfferCollection to sets for faster lookup
    const categoryOfferSet = new Set(
      categoryOffercollectionData.map((offer) => offer.categoryName)
    );
    const productOfferSet = new Set(
      productOfferCollectionData.map((offer) => offer.productName)
    );
    let productCollectionData = await productCollection
      .find()
      .populate("parentCategory");

    for (const prod of productCollectionData) {
      const categoryName = prod.parentCategory.categoryName;
      const productName = prod.productName;

      // Check if category name is present in categoryOffercollection and product name is present in productOfferCollection
      const isInCatOffer = categoryOfferSet.has(categoryName);
      const isInProdOffer = productOfferSet.has(productName);

      if (isInCatOffer && isInProdOffer) {
        await havingBothOffers(productName, categoryName, prod);
      } else if (isInCatOffer || isInProdOffer) {
        let availOffer = isInProdOffer ? "productOffer" : "categoryOffer";
        // console.log("Calling the SinglwOfferS");
        await havingSingleOffer(availOffer, productName, categoryName, prod);
      }
    }
  } catch (error) {
    console.log(
      "Error while applying the product offers in the product page:" + error
    );
  }
};

const checkOfferAvailability = async (req, res) => {
  try {
    let productCollectionData = await productCollection
      .find()
      .populate("parentCategory");

    for (const prod of productCollectionData) {
      if (prod.productOfferId) {
        let ifProdOffer = await productOfferCollection.find({
          _id: prod.productOfferId,
        });
        let ifCatOffer = await categoryOffercollection.find({
          _id: prod.productOfferId,
        });

        if (ifProdOffer || ifCatOffer) {
          let availOffer = ifProdOffer ? ifProdOffer : ifCatOffer;
          let priceBefore = prod.priceBeforeOffer;
          if (!availOffer.currentStatus) {
            result = await productCollection.updateOne(
              { _id: prod._id },
              {
                $set: {
                  productPrice: priceBefore,
                  productOfferId: null,
                  productOfferPercentage: null,
                },
              }
            );
          }
        }
      }
    }
  } catch (error) {
    console.log(
      "Error while checking for if the offer is expired or not :" + error
    );
  }
};

const havingBothOffers = async (productName, categoryName, prod) => {
  try {
    let prodOffer = await productOfferCollection.findOne({ productName });
    let catOffer = await categoryOffercollection.findOne({
      categoryName,
    });
    let maxOffer = Math.max(
      prodOffer.productOfferPercentage,
      catOffer.categoryOfferPercentage
    );

    if (prod.productOfferPercentage !== maxOffer) {
      let offerId;
      if (prodOffer.productOfferPercentage === maxOffer) {
        offerId = prodOffer._id;
      } else if (catOffer.categoryOfferPercentage === maxOffer) {
        offerId = catOffer._id;
      }

      let productPrice = Math.round(
        prod.priceBeforeOffer * (1 - maxOffer * 0.01)
      );

      result = await productCollection.updateOne(
        { _id: prod._id },
        {
          $set: {
            productPrice,
            productOfferId: offerId,
            productOfferPercentage: maxOffer,
          },
        }
      );
    }
  } catch (error) {
    console.log(
      "Error while cheking and updating the offers present in both :" + error
    );
  }
};

const havingSingleOffer = async (
  availOffer,
  productName,
  categoryName,
  prod
) => {
  try {
    if (availOffer === "productOffer") {
      let prodOffer = await productOfferCollection.findOne({ productName });
      if (prod.productOfferPercentage !== prodOffer.productOfferPercentage) {
        let productPrice = Math.round(
          prod.priceBeforeOffer * (1 - prodOffer.productOfferPercentage * 0.01)
        );

        result = await productCollection.updateOne(
          { _id: prod._id },
          {
            $set: {
              productPrice,
              productOfferId: prodOffer._id,
              productOfferPercentage: prodOffer.productOfferPercentage,
            },
          }
        );
      }
    } else if (availOffer === "categoryOffer") {
      let catOffer = await categoryOffercollection.findOne({
        categoryName,
      });
      if (prod.productOfferPercentage !== catOffer.categoryOfferPercentage) {
        let productPrice = Math.round(
          prod.priceBeforeOffer * (1 - catOffer.categoryOfferPercentage * 0.01)
        );

        result = await productCollection.updateOne(
          { _id: prod._id },
          {
            $set: {
              productPrice,
              productOfferId: catOffer._id,
              productOfferPercentage: catOffer.categoryOfferPercentage,
            },
          }
        );
      }
    }
  } catch (error) {
    console.log(
      "Error while applying offer for product holds single offer :" + error
    );
  }
};

module.exports = {
  hashPassword,
  otpPage,
  sendOTP,
  retryOtp,
  verifyOTP,
  resendOTP,
  retryOTP,
  otpSucessPage,
  sendForgetPassOtp,
  verifyForgetOTP,
  updatePassword,
  forgetResendOTP,
  calcStatus,
  applyProductOffer,
  formatDate,
  applyOffers,
  checkOfferAvailability,
};
