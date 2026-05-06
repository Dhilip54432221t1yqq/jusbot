import './src/config/env.js';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import { createServer } from "http";
import { initSocket } from "./src/services/socketService.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from './src/middleware/authMiddleware.js';
import { apiLimiter, authLimiter, webhookLimiter } from './src/middleware/rateLimiter.js';
import authRouter from './src/routes/auth.js';
import sheetsRouter from './src/routes/sheets.js';
import contentRouter from './src/routes/content.js';
import livechatRouter from './src/routes/livechat.js';
import webhooksRouter from './src/routes/webhooks.js';
import instagramRouter from './src/routes/instagram.js';
import flowsRouter from './src/routes/flows.js';
import contactsRouter from './src/routes/contacts.js';
import triggersRouter from './src/routes/triggers.js';
import keywordsRouter from './src/routes/keywords.js';
import automationRouter from './src/routes/automation.js';
import sequencesRouter from './src/routes/sequences.js';
import { checkAndFireSequences } from './src/services/sequenceService.js';
import whatsappCloudRouter from './src/routes/whatsappCloud.js';
import workspacesRouter from './src/routes/workspaces.js';
import ecommerceRouter from './src/routes/ecommerce.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables are loaded in ./src/config/env.js

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);
app.set('io', io);

// --- Security Middleware ---

// Helmet: sets various security headers
app.use(helmet());

// CORS: restrict to known origins
const allowedOrigins = [
  'http://localhost:5173',       // Dev frontend
  'http://51.20.131.117',        // Production
  'https://51.20.131.117',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

// --- Rate Limiters ---
// Auth-related routes get stricter limits
app.use('/api/auth', authLimiter);

// Webhook routes get high-throughput limits (called by external platforms)
app.use('/api/webhooks', webhookLimiter);
app.use('/api/instagram/webhook', webhookLimiter);
app.use('/api/whatsapp-cloud/webhook', webhookLimiter);

// All other API routes get standard limits
app.use('/api', apiLimiter);

// --- Public routes (no auth required) ---
// Google OAuth callbacks and webhook endpoints are NOT protected
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);

// Instagram & WhatsApp webhooks are public (called by Meta servers)
// But the rest of instagram/whatsapp routes need auth — handled inside the routers below

// --- Protected routes (require valid JWT) ---
app.use('/api/sheets', authenticate, sheetsRouter);
app.use('/api/content', authenticate, contentRouter);
app.use('/api/livechat', authenticate, livechatRouter);
app.use('/api/instagram', instagramRouter);           // Mixed: webhooks are public, rest need auth (handled inside router)
app.use('/api/flows', authenticate, flowsRouter);
app.use('/api/contacts', authenticate, contactsRouter);
app.use('/api/whatsapp-cloud', whatsappCloudRouter);   // Mixed: webhooks are public (handled inside router)
app.use('/api/triggers', authenticate, triggersRouter);
app.use('/api/keywords', authenticate, keywordsRouter);
app.use('/api/automation', authenticate, automationRouter);
app.use('/api/sequences', authenticate, sequencesRouter);
app.use('/api/workspaces', authenticate, workspacesRouter);
app.use('/api/ecommerce', authenticate, ecommerceRouter);


// Start Sequence Worker (Check every 60 seconds)
setInterval(() => {
  checkAndFireSequences();
}, 60 * 1000);

app.get("/", (req, res) => {
  res.json({ status: "Reflx backend running 🚀" });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Reflx server running on http://localhost:${PORT}`);
});
