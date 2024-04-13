const userDetailsPage = async (req, res) => {
  try {
    res.render("userViews/userDetails", { user: req.session.currentUser });
  } catch (error) {
    console.log("Error while showing the Users Details Page " + error);
  }
};

const profileEdit = async (req, res) => {
  try {
    console.log("Profile editing is calling");
    const { username, email, phone } = req.body;
    console.log(username);
    console.log(email);
  } catch (error) {
    console.log("Error while Editing the Users' Profile " + error);
  }
};

module.exports = {
  userDetailsPage,
  profileEdit,
};
