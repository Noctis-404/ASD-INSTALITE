const usersService = require("../services/users.service");
const { parsePagination, buildMeta } = require("../utils/pagination");

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
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ error: pagination.error });
    }

    const where = {};

    // search filter
    if (req.query.search && typeof req.query.search === "string" && req.query.search.trim()) {
      const search = req.query.search.trim();
      where.OR = [
        { username: { contains: search } },
        { fullname: { contains: search } },
      ];
    }

    // isPrivate filter
    if (req.query.isPrivate !== undefined) {
      if (req.query.isPrivate === "true") {
        where.isPrivate = true;
      } else if (req.query.isPrivate === "false") {
        where.isPrivate = false;
      } else {
        return res.status(400).json({ error: "isPrivate must be true or false" });
      }
    }

    // hasPosts filter
    if (req.query.hasPosts !== undefined) {
      if (req.query.hasPosts === "true") {
        where.posts = { some: {} };
      } else if (req.query.hasPosts === "false") {
        where.posts = { none: {} };
      } else {
        return res.status(400).json({ error: "hasPosts must be true or false" });
      }
    }

    // sortBy & order
    const sortBy = req.query.sortBy || "createdAt";
    const allowedSortBy = ["username", "fullname", "createdAt"];
    if (!allowedSortBy.includes(sortBy)) {
      return res.status(400).json({
        error: "sortBy must be one of: username, fullname, createdAt",
      });
    }

    let order = "desc";
    if (req.query.order && req.query.order.toLowerCase() === "asc") {
      order = "asc";
    }

    const orderBy = [{ [sortBy]: order }];

    const { total, data } = await usersService.listUsers({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy,
    });

    const meta = buildMeta(pagination.page, pagination.limit, total);
    return res.status(200).json({ data, meta });
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
    if (req.body.isPrivate !== undefined) {
      if (typeof req.body.isPrivate === "boolean") {
        updateData.isPrivate = req.body.isPrivate;
      } else if (req.body.isPrivate === "true" || req.body.isPrivate === "false") {
        updateData.isPrivate = req.body.isPrivate === "true";
      } else {
        return res.status(400).json({ error: "isPrivate must be true or false" });
      }
    }

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

async function getUserPosts(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await usersService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ error: pagination.error });
    }

    const { total, data } = await usersService.getUserPosts(id, {
      skip: pagination.skip,
      take: pagination.take,
    });

    const meta = buildMeta(pagination.page, pagination.limit, total);
    return res.status(200).json({ data, meta });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserLikedPosts(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await usersService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return res.status(400).json({ error: pagination.error });
    }

    const { total, data } = await usersService.getUserLikedPosts(id, {
      skip: pagination.skip,
      take: pagination.take,
    });

    const meta = buildMeta(pagination.page, pagination.limit, total);
    return res.status(200).json({ data, meta });
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
  getUserPosts,
  getUserLikedPosts,
};
