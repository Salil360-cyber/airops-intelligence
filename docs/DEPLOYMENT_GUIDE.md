# AirOps Intelligence — Deployment & Operations Guide

This guide describes how to configure, build, and deploy the AirOps Intelligence application for local demonstration, staging review, or containerized cloud hosting.

---

## 1. Prerequisites

- **Node.js:** Version `>= 22.0.0`
- **npm:** Version `>= 10.0.0`
- **Gemini API Key:** A valid Google AI Studio API key (configured in `GEMINI_API_KEY`).

---

## 2. Environment Configuration

Create a `.env` file in the project root:

```bash
# GEMINI_API_KEY: Required for server-side Gemini AI features.
GEMINI_API_KEY="your-google-ai-studio-api-key"

# PORT: Server listening port (defaults to 3000)
PORT=3000

# NODE_ENV: Set to 'production' for compiled asset delivery
NODE_ENV=production
```

> **Security Rule:** Never commit `.env` containing live API keys to Git. Keep `.env` in `.gitignore`.

---

## 3. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript checks
npm run lint

# 3. Start development server on port 3000 (with Vite middlewares)
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 4. Production Build & Execution

The production build compiles the React application into code-split static assets and compiles the Express backend (`server.ts`) into a standalone Node bundle (`dist/server.js`).

```bash
# 1. Build frontend bundle and compile server
npm run build

# 2. Start production server (runs pure Node 22 without runtime TS compilers)
npm start
```

### Express Production Asset Serving
In `server.ts`:
```typescript
if (process.env.NODE_ENV === 'production') {
  const staticDir = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
    ? path.resolve(__dirname, 'dist')
    : path.resolve(__dirname);

  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticDir, 'index.html'));
  });
}
```

---

## 5. Containerized Deployment (Docker / Google Cloud Run)

The repository includes a multi-stage `Dockerfile` and `.dockerignore`.

### Production `Dockerfile`
```dockerfile
# Multi-stage Docker build for AirOps Intelligence
# Stage 1: Build Frontend Assets and Server
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Container
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and compiled server
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Docker Local Build & Run
```bash
# 1. Build image
docker build -t airops-intelligence:latest .

# 2. Run container with configured port and API key
docker run -p 3000:3000 -e GEMINI_API_KEY="your-api-key" airops-intelligence:latest
```

### Deploy to Google Cloud Run
```bash
gcloud run deploy airops-intelligence \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="YOUR_KEY_HERE"
```

---

## 6. Persistence Considerations in Multi-Device Environments

- **Current Prototype:** Uses browser `localStorage` on the client origin.
- **Limitation:** Data entered in one browser (e.g. Chrome on Laptop A) will **not** automatically sync to another browser (e.g. Safari on iPad B).
- **Enterprise Recommendation:** For production multi-user collaboration, replace client `localStorage` with a hosted cloud database (Google Cloud Firestore or PostgreSQL on Cloud SQL) via REST or GraphQL APIs.
