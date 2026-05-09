# The Hero Kids StoryLab

> **The world's first AI children's book where YOUR child is the real illustrated hero**
> Real face. Real story. Real magic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB Atlas |
| Queue | Bull + Redis |
| AI Story | Anthropic Claude API |
| AI Images | Replicate API (SDXL + IP-Adapter) |
| AI Voice | ElevenLabs API |
| Payments | Stripe |
| Print | Gelato API |
| Storage | Cloudinary + AWS S3 |
| Email | SendGrid |

---

## Prerequisites

- Node.js >= 18
- Docker + Docker Compose (for Redis)
- MongoDB Atlas account
- API keys for: Anthropic, Replicate, ElevenLabs, Stripe, Gelato, Cloudinary, AWS, SendGrid

---

## Quick Start

### 1. Clone and configure

```bash
git clone <repo>
cd myHeroBook
cp .env.example .env
# Edit .env with your actual API keys
```

### 2. Start Redis

```bash
docker-compose up redis -d
```

### 3. Install and run the backend

```bash
cd server
npm install
npm run dev
```

### 4. In a separate terminal, start the queue worker

```bash
cd server
npm run dev:worker
```

### 5. Install and run the frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
myHeroBook/
├── client/          # React frontend (Vite)
├── server/          # Node.js API + queue workers
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Product Tiers

| Tier | Price | Includes |
|---|---|---|
| Digital PDF | €9.99 | 32-page AI-illustrated PDF, instant download |
| Printed Book | €34.99 | Hardcover + PDF, QR audio pages, gift box |
| Magic Voice Book | €54.99 | Everything + parent voice cloning narration |

---

## Build Steps

- [x] Step 1: Folder structure, packages, Docker, env
- [x] Step 2: MongoDB schemas (5 models: User, ChildProfile, BookProject, Order, BookSeries)
- [x] Step 3: Express routes + controllers (fully implemented)
- [x] Step 4: Auth system — JWT, refresh token rotation, password reset, Login/Register pages
- [x] Step 5: Landing page — 7 sections, Framer Motion, all animations
- [x] Step 6: Book creation wizard — all 5 steps, validation, photo upload, VoiceRecorder
- [x] Step 7: Claude AI story generation — Anthropic SDK, 32-page JSON, prompt engineering, storyQueue processor
- [x] Step 8: Replicate image generation — IP-Adapter SDXL, face-consistent illustration, Cloudinary upload, pipeline advance
- [x] Step 9: Puppeteer PDF assembly — cover + 32 pages, Puppeteer HTML→PDF, S3 upload, status: ready
- [x] Step 10: Stripe checkout — EmbeddedCheckout, Preview page with polling, webhook shipping+PDF linking
- [x] Step 11: Gelato print integration — Gelato v4 API, auto-submit after PDF ready, signed S3 URL, webhook tracking
- [x] Step 12: ElevenLabs voice cloning — eleven_multilingual_v2 TTS, S3 audio upload, voiceQueue processor
- [x] Step 13: QR code + audio player — QR generation per page, ReadPage mobile player, public API route
- [x] Step 14: User dashboard — books grid, order status, progress polling, download, Account page (profile edit, voice upload, subscription)
- [x] Step 15: Email notifications — order confirmation (Stripe webhook), download ready (pdfQueue), shipment tracking (Gelato webhook)
