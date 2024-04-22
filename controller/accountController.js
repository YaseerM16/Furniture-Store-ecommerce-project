const userCollection = require("../models/userModel");
const addressCollection = require("../models/addressModel");
const { Long } = require("mongodb");

const userDetailsPage = async (req, res) => {
  try {
    res.render("userViews/userDetails", { user: req.session.currentUser });
  } catch (error) {
    console.log("Error while showing the Users Details Page " + error);
  }
};

const profileEdit = async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const userDet = await userCollection.findOne({ email });
    if (!userDet) {
      return res.status(404).json({ error: "User not found" });
    } else {
      await userCollection.updateOne(
        { _id: userDet._id },
        {
          $set: {
            username: username,
            email: email,
            phone: phone,
          },
        }
      );
      res.send({ success: true });
    }
  } catch (error) {
    console.log("Error while Editing the Users' Profile " + error);
  }
};

const addressPage = async (req, res) => {
  try {
    const userId = req.session.currentUser._id;
    const userAddress = await addressCollection.find({
      userId: userId,
    });
    res.render("userViews/address", {
      user: req.session.currentUser,
      addresses: userAddress,
    });
  } catch (error) {
    console.log("Error while showing the address page in user Account" + error);
  }
};

const addAddressPage = (req, res) => {
  try {
    res.render("userViews/addAddress", { user: req.session.currentUser });
  } catch (error) {
    console.log("Error While showing the Add Address Page: " + error);
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.currentUser._id;
    const address = {
      userId: userId,
      addressTitle: req.body.addressTitle,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      zipcode: req.body.pinCode,
      phone: req.body.phone,
      alternateNumber: req.body.alternateNumber,
    };
    await addressCollection.insertMany([address]);
    res.send({ success: true });
  } catch (error) {
    console.log("Error While Adding the Address " + error);
    return res
      .status(500)
      .json({ success: false, error: "Error adding the address" });
  }
};

const editAddress = async (req, res) => {
  try {
    const editAddress = addressCollection.findOne({ _id: req.query.id });
    if (!editAddress) {
      console.log("Address is not Exsisted");
    } else {
      await addressCollection.updateOne(
        { _id: req.query.id },
        {
          $set: {
            addressTitle: req.body.title,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            addressLine1: req.body.addressLine1,
            addressLine2: req.body.addressLine2,
            city: req.body.city,
            state: req.body.state,
            zipcode: req.body.pinCode,
            phone: req.body.phone,
            alternateNumber: req.body.alternateNumber,
          },
        }
      );
      res.send({ success: true });
    }
  } catch (error) {
    console.log("Error while editing the Address" + error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const address = await addressCollection.findByIdAndDelete(addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting address" });
  }
};

module.exports = {
  userDetailsPage,
  profileEdit,
  addressPage,
  addAddressPage,
  addAddress,
  editAddress,
  deleteAddress,
};
