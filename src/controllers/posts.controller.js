const postsService = require("../services/posts.service");

async function create(req, res) {
  try {
    const { imageUrl, caption, location } = req.body || {};

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const postData = {
      imageUrl: imageUrl.trim(),
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
    const posts = await postsService.listPosts();
    return res.status(200).json(posts);
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

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
