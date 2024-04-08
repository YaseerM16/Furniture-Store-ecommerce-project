const bcrypt = require("bcrypt");
const Otp = require("../models/otpModel");
const nodemailer = require("nodemailer");
const userCollection = require("../models/userModel");

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
const sendOTP = async (req, res) => {
  try {
    if (req.session.logged) {
      res.redirect("/");
    } else {
      console.log(req.session.passed);
      const { email } = req.session.newUser;

      // Check if email is already registered
      const existingUser = await Otp.findOne({ email });
      if (existingUser) {
        req.session.userExist = true;
        res.redirect("/signUp");
      } else {
        // Generate OTP
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
          res.render("userViews/otpPage", {
            inValid: false,
          });
        });
      }
    }
  } catch (error) {
    console.log("Error while sending OTP" + error);
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
        const { username, email, phonenumber, password, isBlocked } =
          req.session.newUser;

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
          // You can define youruser model and add the user here
          let addUser = await new userCollection({
            username,
            email,
            phonenumber,
            password,
            isBlocked,
          }).save();
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
  const { email } = req.session.newUser;
  console.log(email);

  // Delete existing OTP from the database
  await Otp.deleteOne({ email });

  // Send new OTP
  sendOTP(req.session.newUser);
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
module.exports = {
  hashPassword,
  sendOTP,
  verifyOTP,
  resendOTP,
  retryOTP,
  otpSucessPage,
};
