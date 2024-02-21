const userModels = require('../Models/user');
const userViews = require('../Views/userView');

// add a user
async function addUser(req, res) {
    try {
        const newUser = req.body;
        // await userModels.connect();
        await userModels.addUser(newUser);
        userViews.renderSuccessMessage('user added successfully');
        res.send({
            success: true,
            message: "user added successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "An error occurred",
        });
    }
}

// login a user
async function loginUser(req, res) {
    const { email, password } = req.body;
    // await userModels.connect();
    const user = await userModels.loginUser(email, password);
    if (user) {
        res.send({
            success: true,
            message: "user logged in successfully",
            data: user,
        });
    } else {
        res.send({
            success: false,
            message: "user not found",
        });
    }
}

//Get all users
async function getAllUsers (req, res) {
    try {
      const users = await userModels.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching users' });
    }
  }

// forgot password
async function forgotPassword(req, res) {
    const { email } = req.body;
    await productModel.connect();
    const user = await userModels.forgotPassword(email);
    if (user) {
        res.send({
            success: true,
            message: "user found",
            data: user,
        });
    } else {
        res.send({
            success: false,
            message: "user not found",
        });
    }
}

// update password
async function updatePassword(req, res) {
    const { email, password } = req.body;
    // await userModels.connect();
    const isUpdated = await userModels.updatePassword(email, password);
    if (isUpdated) {
        res.send({
            success: true,
            message: "password updated successfully",
        });
    } else {
        res.send({
            success: false,
            message: "user not found",
        });
    }
}

module.exports = {
    addUser,
    loginUser,
    getAllUsers,
    forgotPassword,
    updatePassword,
};
