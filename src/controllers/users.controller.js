const usersService = require("../services/users.service");

async function create(req, res) {
  try {
    const { username, email, fullname, bio } = req.body || {};

    if (
      !username ||
      !email ||
      !fullname ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof fullname !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !fullname.trim()
    ) {
      return res.status(400).json({ error: "username, email and fullname are required" });
    }

    const userData = {
      username: username.trim(),
      email: email.trim(),
      fullname: fullname.trim(),
    };

    if (bio !== undefined) {
      userData.bio = bio;
    }

    const createdUser = await usersService.createUser(userData);
    return res.status(201).json(createdUser);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  try {
    const users = await usersService.listUsers();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOne(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await usersService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await usersService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {};
    if (req.body.fullname !== undefined) updateData.fullname = req.body.fullname;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;
    if (req.body.isPrivate !== undefined) updateData.isPrivate = Boolean(req.body.isPrivate);

    const updatedUser = await usersService.updateUser(id, updateData);
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await usersService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await usersService.deleteUser(id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
