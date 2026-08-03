const express = require('express')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const articleRoutes = require('./routes/article.routes')
const cors = require('cors')

const app = express()
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)


module.exports = app