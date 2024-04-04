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
const sendOTP = async (addUser) => {
  console.log("Send OTP Called");
  const { email } = addUser;

  // Check if email is already registered
  const existingUser = await Otp.findOne({ email });
  if (existingUser) {
    return { message: "Email already registered" };
  }

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
    // newOtp.save((err, savedOtp) => {
    //   if (err) {
    //     console.log(error);
    //     return { message: "Error saving OTP to the database" };
    //   }
    //   console.log("OTP saved", savedOtp);
    //   return { message: "OTP sent successfully" };
    // });
  });
};

const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const { username, email, phonenumber, password, isBlocked } =
    req.session.newUser;

  // Check if OTP is valid
  const existingOtp = await Otp.findOne({ email, otp });
  if (!existingOtp || existingOtp.createdAt < Date.now() - 5 * 60 * 1000) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Delete OTP from the database
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

  res.status(200).json({ message: "OTP verified successfully" });
};

const resendOTP = async (req, res) => {
  const { email } = req.session.newUser;
  console.log(email);

  // Delete existing OTP from the database
  await Otp.deleteOne({ email });

  // Send new OTP
  sendOTP(req.session.newUser);
};
module.exports = {
  hashPassword,
  sendOTP,
  verifyOTP,
  resendOTP,
};
