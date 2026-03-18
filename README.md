# Custom Dashboard Builder (MERN)

A MERN (MongoDB, Express, React, Node.js) starter project implementing a Custom Dashboard Builder style UI for managing customer orders.

## Features

- REST API for orders (create/read/update/delete)
- React frontend with order form, table, and dashboard cards
- Responsive layout for desktop/tablet/mobile
- Uses MongoDB for persistent storage

## Getting Started

### Prerequisites

- Node.js 18+ (includes npm)
- MongoDB running locally (or set `MONGO_URI` to a hosted database)

### Run locally

1. Install dependencies

```bash
npm run install:all
```

2. Copy backend env file

```bash
cd backend
copy .env.example .env
```

3. Start the app

```bash
npm start
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## API Endpoints

- `GET /api/orders` - list orders
- `POST /api/orders` - create order
- `GET /api/orders/:id` - get order
- `PUT /api/orders/:id` - update order
- `DELETE /api/orders/:id` - delete order

## Notes

- The frontend is a React app built with Create React App.
- The backend uses Express and Mongoose.

DEMO LINK : 
https://drive.google.com/file/d/1Pk7GXndbfQ9DhWWUn_FYYTAxEzuPCFRW/view?usp=sharing


