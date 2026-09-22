const express = require('express')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const articleRoutes = require('./routes/article.routes')
const adminRoutes = require('./routes/admin.routes')
const codeDebugRoutes = require('./routes/codeDebug.routes')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(cookieParser())
// CORS: allow the configured client origin(s). In development allow localhost dev server origins.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://complexell.souel.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/code-debug', codeDebugRoutes)

// Serve the built frontend in production when the dist folder is available.
const frontendDist = path.join(__dirname, '../../Frontend/dist')
app.use(express.static(frontendDist))
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }

  res.sendFile(path.join(frontendDist, 'index.html'))
})

module.exports = app