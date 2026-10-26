# InstaLite — Express + Prisma CRUD Backend

A modular Node.js Express backend using Prisma ORM with SQLite, built strictly following the MVC architectural pattern.

## Project Structure

```
├── .env
├── .env.example
├── .gitignore
├── package.json
├── prisma
│   └── schema.prisma
├── prisma7.config.js
├── src
│   ├── app.js
│   ├── db.js
│   ├── index.js
│   ├── server.js
│   ├── controllers
│   │   ├── posts.controller.js
│   │   └── users.controller.js
│   ├── routes
│   │   ├── posts.routes.js
│   │   └── users.routes.js
│   └── services
│       ├── posts.service.js
│       └── users.service.js
└── tests
    └── api.test.js
```

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Sync & Prisma Client Generation
```bash
npx prisma generate
npx prisma db push
```

### 3. Start the Server
```bash
npm start
# or
node src/index.js
```
The server starts on port `3000` (or `PORT` from `.env`) and outputs:
```
Server started on port 3000
```

### 4. Run Automated Tests
```bash
npm test
```

---

## API Endpoints Reference

### Health Check
- `GET /health` — Returns status 200 with `{ "status": "OK" }`

### Users (`/users`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/users` | Create a user (`username`, `email`, `fullname` required, `bio` optional). Disallowed fields ignored. | `201`, `400`, `409` |
| `GET` | `/users` | List all users | `200` |
| `GET` | `/users/:id` | Get user by ID | `200`, `404` |
| `PATCH` | `/users/:id` | Partial update (`fullname`, `bio`, `isPrivate`). `username` and `email` ignored. | `200`, `404` |
| `DELETE` | `/users/:id` | Delete user | `204`, `404` |

### Posts (`/posts`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/posts` | Create a post (`imageUrl` required, `caption` and `location` optional). Disallowed fields ignored. | `201`, `400` |
| `GET` | `/posts` | List all posts | `200` |
| `GET` | `/posts/:id` | Get post by ID | `200`, `404` |
| `PATCH` | `/posts/:id` | Partial update (`caption`, `location`). `imageUrl` ignored. | `200`, `404` |
| `DELETE` | `/posts/:id` | Delete post | `204`, `404` |
