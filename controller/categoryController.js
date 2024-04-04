const categoryCollection = require("../models/categoryModel");

const categoryList = async (req, res) => {
  try {
    const catCollection = await categoryCollection.find();
    console.log(catCollection);
    res.render("adminViews/categoryList", { categoryDet: catCollection });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  categoryList,
};
