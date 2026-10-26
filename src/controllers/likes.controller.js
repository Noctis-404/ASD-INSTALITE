const likesService = require("../services/likes.service");
const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");

async function likePost(req, res) {
  try {
    const { userId } = req.body || {};

    // 1. userId missing -> 400
    if (userId === undefined || userId === null || userId === "") {
      return res.status(400).json({ error: "userId is required" });
    }

    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 2. No post with that id -> 404
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await postsService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // 3. No user with that userId -> 404
    const user = await usersService.getUserById(parsedUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4. Try insert; if duplicate caught P2002 -> 409
    try {
      const createdLike = await likesService.createLike(parsedUserId, postId);
      return res.status(201).json({
        userId: createdLike.userId,
        postId: createdLike.postId,
        createdAt: createdLike.createdAt,
      });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Already liked" });
      }
      throw err;
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function unlikePost(req, res) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(postId) || isNaN(userId)) {
      return res.status(404).json({ error: "Like not found" });
    }

    try {
      await likesService.deleteLike(userId, postId);
      return res.status(204).send();
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Like not found" });
      }
      throw err;
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  likePost,
  unlikePost,
};
