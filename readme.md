# 🚗 Workshop Finder (PWA)

Workshop Finder is a full-stack app split into 2 directories:

- `frontend` → React + Vite + Tailwind + Leaflet + PWA
- `backend` → Node.js + Express + Prisma + JWT

It includes:

- User authentication (register/login/profile)
- Workshop listing + details + create workshop
- Favorites (save/remove/list)
- Reviews (add/list/average rating)
- Nearby detection using geolocation + Haversine distance
- OpenStreetMap map view with workshop markers

## 📦 Project Structure

```
workshop-finder/
├── frontend/
├── backend/
└── readme.md
```

## 🧰 Tech Stack

### Frontend

- React (Vite)
- TailwindCSS
- React Router
- Axios
- Leaflet + OpenStreetMap
- `vite-plugin-pwa`

### Backend

- Node.js + Express
- Prisma ORM
- JWT auth + bcrypt password hashing
- Input validation with Zod
- Rate limiting + Helmet + CORS
- SQLite (default for easy local run)

## 🚀 Quick Start

## 1) Backend setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:5000`

Demo user after seed:

- Email: `demo@example.com`
- Password: `password123`

## 2) Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔌 API Endpoints (MVP)

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google` (Google sign-in / sign-up)
- `GET /auth/me` (protected)

### Workshops

- `GET /workshops`
- `GET /workshops/:id`
- `GET /workshops/nearby?lat=&lng=&radiusKm=`
- `POST /workshops` (protected)

### Favorites

- `GET /favorites` (protected)
- `POST /favorites/:workshopId` (protected)
- `DELETE /favorites/:workshopId` (protected)

### Reviews

- `GET /reviews/:workshopId`
- `POST /reviews/:workshopId` (protected)

## 🔒 Security Notes

- Passwords are hashed with `bcryptjs`
- JWT expiry is enabled
- API rate limiting is enabled
- Input validation is enforced with `zod`
- Use HTTPS and strong secrets in production

## ⚙️ Environment Files

`backend/.env`

```env
DATABASE_URL="file:./dev.db"
PORT=5000
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
```

`frontend/.env`

```env
VITE_API_URL="http://localhost:5000"
VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id"
```

To enable Google sign-in:

- Create an OAuth Client ID in Google Cloud Console (type: Web application)
- Add authorized JavaScript origins like `http://localhost:5173` (and `http://localhost:5174` if Vite picks another port)
- Set `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) to that Client ID

## 🐳 Run with Docker

### Backend only (Dockerfile)

```bash
docker build -t workshop-finder-backend ./backend
docker run --rm -p 5000:5000 -v workshop_finder_backend_data:/data workshop-finder-backend
```

### Frontend only (Dockerfile)

```bash
docker build -t workshop-finder-frontend --build-arg VITE_API_URL=http://localhost:5000 ./frontend
docker run --rm -p 5173:5173 workshop-finder-frontend
```

### Full stack (Docker Compose)

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`