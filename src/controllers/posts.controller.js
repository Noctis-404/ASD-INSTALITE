const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");
const { parsePagination, buildMeta } = require("../utils/pagination");

async function create(req, res) {
  try {
    const { imageUrl, authorId, caption, location } = req.body || {};

    if (
      !imageUrl ||
      authorId === undefined ||
      authorId === null ||
      typeof imageUrl !== "string" ||
      !imageUrl.trim()
    ) {
      return res.status(400).json({ error: "imageUrl and authorId are required" });
    }

    const parsedAuthorId = parseInt(authorId, 10);
    if (isNaN(parsedAuthorId)) {
      return res.status(400).json({ error: "imageUrl and authorId are required" });
    }

    const author = await usersService.getUserById(parsedAuthorId);
    if (!author) {
      return res.status(404).json({ error: "User not found" });
    }

    const postData = {
      imageUrl: imageUrl.trim(),
      authorId: parsedAuthorId,
    };

    if (caption !== undefined) {
      postData.caption = caption;
    }

    if (location !== undefined) {
      postData.location = location;
    }

    const createdPost = await postsService.createPost(postData);
    return res.status(201).json(createdPost);
  } catch (error) {
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
        { caption: { contains: search } },
        { location: { contains: search } },
      ];
    }

    // location filter
    if (req.query.location && typeof req.query.location === "string" && req.query.location.trim()) {
      where.location = { contains: req.query.location.trim() };
    }

    // sortBy & order
    const sortBy = req.query.sortBy || "createdAt";
    const allowedSortBy = ["createdAt", "updatedAt", "likes"];
    if (!allowedSortBy.includes(sortBy)) {
      return res.status(400).json({
        error: "sortBy must be one of: createdAt, updatedAt, likes",
      });
    }

    let order = "desc";
    if (req.query.order && req.query.order.toLowerCase() === "asc") {
      order = "asc";
    }

    let orderBy;
    if (sortBy === "likes") {
      orderBy = [{ likes: { _count: order } }, { createdAt: "desc" }];
    } else {
      orderBy = [{ [sortBy]: order }];
    }

    const { total, data } = await postsService.listPosts({
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
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await postsService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingPost = await postsService.getPostById(id);
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updateData = {};
    if (req.body.caption !== undefined) updateData.caption = req.body.caption;
    if (req.body.location !== undefined) updateData.location = req.body.location;

    const updatedPost = await postsService.updatePost(id, updateData);
    return res.status(200).json(updatedPost);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingPost = await postsService.getPostById(id);
    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    await postsService.deletePost(id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getLikes(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await postsService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userSummaries = await postsService.getPostLikes(id);
    return res.status(200).json(userSummaries);
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
  getLikes,
};
