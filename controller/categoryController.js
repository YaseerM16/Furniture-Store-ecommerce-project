const categoryCollection = require("../models/categoryModel");
const adminCollection = require("../models/adminModel");

const categoryList = async (req, res) => {
  try {
    let user;
    if (req.session.adminLog) {
      user = await adminCollection.findOne({ _id: req.session.adminUser._id });
    } else {
      user = {};
    }

    const page = Number(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const catCollection = await categoryCollection
      .find()
      .skip(skip)
      .limit(limit);

    let pages;

    await categoryCollection
      .countDocuments()
      .then((count) => {
        pages = count;
      })
      .catch((err) => console.log("Error while counting the docment" + err));

    res.render("adminViews/categoryList", {
      categoryDet: catCollection,
      page: page,
      pages: Math.ceil(pages / limit),
      user: user,
    });
  } catch (err) {
    console.log(err);
  }
};

const addCategory = async (req, res) => {
  try {
    const newCategory = new categoryCollection({
      categoryName: req.body.categoryName,
      categoryDescription: req.body.categoryDes,
    });
    // const catExists = await categoryCollection.findOne({ categoryName: req.body.categoryName })
    const trimmedCategoryName = req.body.categoryName.trim();
    const catExists = await categoryCollection.findOne({
      categoryName: {
        $regex: new RegExp("^" + trimmedCategoryName.toLowerCase() + "$", "i"),
      },
    });

    if (catExists) {
      res.send({ invalid: true });
    } else {
      newCategory.save();
      res.send({ success: true });
    }
  } catch (err) {
    console.log(err);
  }
};

const editCategory = async (req, res) => {
  try {
    const trimmedCategoryName = req.body.categoryName.trim();
    const catDetails = await categoryCollection.findOne({
      categoryName: {
        $regex: new RegExp("^" + trimmedCategoryName.toLowerCase() + "$", "i"),
      },
    });

    if (
      /^\s*$/.test(req.body.categoryName) ||
      /^\s*$/.test(req.body.categoryDes)
    ) {
      res.send({ noValue: true });
    } else if (catDetails && catDetails._id != req.body.categoryId) {
      res.send({ exists: true });
    } else {
      await categoryCollection.updateOne(
        { _id: req.body.categoryId },
        {
          $set: {
            categoryName: req.body.categoryName,
            categoryDescription: req.body.categoryDes,
          },
        }
      );
      res.send({ success: true });
    }
  } catch (err) {
    console.log(err);
  }
};
const listCategory = async (req, res) => {
  try {
    console.log(req.query.id);
    await categoryCollection.updateOne(
      { categoryName: req.query.id },
      { $set: { isListed: false } }
    );
    res.send({ list: true });
  } catch (err) {
    console.log(err);
  }
};
const unListCategory = async (req, res) => {
  try {
    console.log(req.query.id);
    await categoryCollection.updateOne(
      { categoryName: req.query.id },
      { $set: { isListed: true } }
    );
    res.send({ unlist: true });
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  categoryList,
  addCategory,
  editCategory,
  categoryList,
  listCategory,
  unListCategory,
};
