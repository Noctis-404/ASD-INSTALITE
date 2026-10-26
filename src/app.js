const express = require("express");
const usersRoutes = require("./routes/users.routes");
const postsRoutes = require("./routes/posts.routes");

const app = express();

app.use(express.json());

// Root endpoint - API documentation & status
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to InstaLite API",
    status: "running",
    endpoints: {
      health: "GET /health",
      users: {
        list: "GET /users",
        getOne: "GET /users/:id",
        create: "POST /users",
        update: "PATCH /users/:id",
        delete: "DELETE /users/:id",
      },
      posts: {
        list: "GET /posts",
        getOne: "GET /posts/:id",
        create: "POST /posts",
        update: "PATCH /posts/:id",
        delete: "DELETE /posts/:id",
      },
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Mount modular routes
app.use("/users", usersRoutes);
app.use("/posts", postsRoutes);

module.exports = app;
