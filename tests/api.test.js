const assert = require("assert");
const app = require("../src/app");
const prisma = require("../src/db");

const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(async () => {
        await prisma.$disconnect();
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function clearDatabase() {
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
}

let passedTests = 0;
let totalTests = 0;

function reportTest(name, passed, detail = "") {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}: ${detail}`);
  }
}

async function runTests() {
  console.log("\n=== Starting InstaLite Test Suite ===\n");
  await startServer();
  await clearDatabase();

  try {
    // 1. Health check
    {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      reportTest(
        "GET /health returns 200 and { status: 'OK' }",
        res.status === 200 && data.status === "OK" && res.headers.get("content-type")?.includes("application/json")
      );
    }

    // 2. User CRUD
    // Step 04 tests
    let userId1;
    {
      // 1: Valid user create
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "riya_travels",
          email: "riya@example.com",
          fullname: "Riya Sharma",
        }),
      });
      const data = await res.json();
      userId1 = data.id;
      reportTest(
        "POST /users valid creation returns 201 with user object",
        res.status === 201 &&
          data.id &&
          data.username === "riya_travels" &&
          data.email === "riya@example.com" &&
          data.fullname === "Riya Sharma" &&
          data.bio === null &&
          data.isPrivate === false &&
          data.createdAt &&
          data.updatedAt
      );
    }

    {
      // 2: Duplicate username
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "riya_travels",
          email: "other@example.com",
          fullname: "Copy Cat",
        }),
      });
      const data = await res.json();
      reportTest(
        "POST /users duplicate username returns 409 { error: 'username or email already taken' }",
        res.status === 409 && data.error === "username or email already taken"
      );
    }

    {
      // 3: Missing required fields
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "onlyname",
        }),
      });
      const data = await res.json();
      reportTest(
        "POST /users missing required fields returns 400 { error: 'username, email and fullname are required' }",
        res.status === 400 && data.error === "username, email and fullname are required"
      );
    }

    {
      // 4: Client sets disallowed field like id: 999
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "sneaky",
          email: "sneaky@example.com",
          fullname: "Sneaky",
          id: 999,
        }),
      });
      const data = await res.json();
      reportTest(
        "POST /users ignores passed id: 999 and assigns auto-increment id",
        res.status === 201 && data.id && data.id !== 999
      );
    }

    // Step 05: GET /users
    {
      const res = await fetch(`${BASE_URL}/users`);
      const data = await res.json();
      reportTest(
        "GET /users returns 200 with JSON array of users",
        res.status === 200 && Array.isArray(data) && data.length === 2
      );
    }

    // Step 06: GET /users/:id
    {
      const resSuccess = await fetch(`${BASE_URL}/users/${userId1}`);
      const dataSuccess = await resSuccess.json();
      reportTest(
        "GET /users/:id existing returns 200 with user",
        resSuccess.status === 200 && dataSuccess.id === userId1
      );

      const resNotFound = await fetch(`${BASE_URL}/users/99999`);
      const dataNotFound = await resNotFound.json();
      reportTest(
        "GET /users/:id non-existing returns 404 { error: 'User not found' }",
        resNotFound.status === 404 && dataNotFound.error === "User not found"
      );
    }

    // Step 07: PATCH /users/:id
    {
      const res = await fetch(`${BASE_URL}/users/${userId1}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: "Riya Sharma Updated",
          bio: "Photographer & Traveler",
          isPrivate: true,
          username: "hacked_username",
          email: "hacked_email@example.com",
        }),
      });
      const data = await res.json();
      reportTest(
        "PATCH /users/:id updates fullname, bio, isPrivate and ignores username/email",
        res.status === 200 &&
          data.fullname === "Riya Sharma Updated" &&
          data.bio === "Photographer & Traveler" &&
          data.isPrivate === true &&
          data.username === "riya_travels" &&
          data.email === "riya@example.com"
      );

      const resNotFound = await fetch(`${BASE_URL}/users/99999`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname: "Nobody" }),
      });
      const dataNotFound = await resNotFound.json();
      reportTest(
        "PATCH /users/:id non-existing returns 404 { error: 'User not found' }",
        resNotFound.status === 404 && dataNotFound.error === "User not found"
      );
    }

    // Step 08: DELETE /users/:id
    {
      const res = await fetch(`${BASE_URL}/users/${userId1}`, {
        method: "DELETE",
      });
      const text = await res.text();
      reportTest(
        "DELETE /users/:id existing returns 204 with empty body",
        res.status === 204 && text === ""
      );

      const resNotFound = await fetch(`${BASE_URL}/users/${userId1}`, {
        method: "DELETE",
      });
      const dataNotFound = await resNotFound.json();
      reportTest(
        "DELETE /users/:id already deleted returns 404 { error: 'User not found' }",
        resNotFound.status === 404 && dataNotFound.error === "User not found"
      );
    }

    // 3. Post CRUD (Steps 13-17)
    let postId1;
    // Step 13: POST /posts
    {
      // Missing imageUrl
      const resMissing = await fetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: "Sunset" }),
      });
      const dataMissing = await resMissing.json();
      reportTest(
        "POST /posts missing imageUrl returns 400 { error: 'imageUrl is required' }",
        resMissing.status === 400 && dataMissing.error === "imageUrl is required"
      );

      // Valid post creation
      const resValid = await fetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/photos/beach.jpg",
          caption: "Sunny days at the beach",
          location: "Goa, India",
          fakeField: "should_be_ignored",
        }),
      });
      const dataValid = await resValid.json();
      postId1 = dataValid.id;
      reportTest(
        "POST /posts valid returns 201 with post object",
        resValid.status === 201 &&
          dataValid.id &&
          dataValid.imageUrl === "https://example.com/photos/beach.jpg" &&
          dataValid.caption === "Sunny days at the beach" &&
          dataValid.location === "Goa, India" &&
          dataValid.createdAt &&
          dataValid.updatedAt
      );
    }

    // Step 14: GET /posts
    {
      const res = await fetch(`${BASE_URL}/posts`);
      const data = await res.json();
      reportTest(
        "GET /posts returns 200 with JSON array of posts",
        res.status === 200 && Array.isArray(data) && data.length === 1
      );
    }

    // Step 15: GET /posts/:id
    {
      const resSuccess = await fetch(`${BASE_URL}/posts/${postId1}`);
      const dataSuccess = await resSuccess.json();
      reportTest(
        "GET /posts/:id existing returns 200 with post",
        resSuccess.status === 200 && dataSuccess.id === postId1
      );

      const resNotFound = await fetch(`${BASE_URL}/posts/99999`);
      const dataNotFound = await resNotFound.json();
      reportTest(
        "GET /posts/:id non-existing returns 404 { error: 'Post not found' }",
        resNotFound.status === 404 && dataNotFound.error === "Post not found"
      );
    }

    // Step 16: PATCH /posts/:id
    {
      const res = await fetch(`${BASE_URL}/posts/${postId1}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: "Updated caption: Golden Hour",
          location: "North Goa",
          imageUrl: "https://hacked.com/image.jpg",
        }),
      });
      const data = await res.json();
      reportTest(
        "PATCH /posts/:id updates caption/location and ignores imageUrl",
        res.status === 200 &&
          data.caption === "Updated caption: Golden Hour" &&
          data.location === "North Goa" &&
          data.imageUrl === "https://example.com/photos/beach.jpg"
      );

      const resNotFound = await fetch(`${BASE_URL}/posts/99999`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: "Non existent" }),
      });
      const dataNotFound = await resNotFound.json();
      reportTest(
        "PATCH /posts/:id non-existing returns 404 { error: 'Post not found' }",
        resNotFound.status === 404 && dataNotFound.error === "Post not found"
      );
    }

    // Step 17: DELETE /posts/:id
    {
      const res = await fetch(`${BASE_URL}/posts/${postId1}`, {
        method: "DELETE",
      });
      const text = await res.text();
      reportTest(
        "DELETE /posts/:id existing returns 204 with empty body",
        res.status === 204 && text === ""
      );

      const resNotFound = await fetch(`${BASE_URL}/posts/${postId1}`, {
        method: "DELETE",
      });
      const dataNotFound = await resNotFound.json();
      reportTest(
        "DELETE /posts/:id already deleted returns 404 { error: 'Post not found' }",
        resNotFound.status === 404 && dataNotFound.error === "Post not found"
      );
    }

    console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);
    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    await stopServer();
  }
}

runTests();
