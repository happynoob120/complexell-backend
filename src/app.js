const express = require('express')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const articleRoutes = require('./routes/article.routes')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
)
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)

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