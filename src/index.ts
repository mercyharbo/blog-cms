import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { supabase } from './config/supabase'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth'
import { contentRoutes } from './routes/content'
import { mediaRoutes } from './routes/media'

// Load environment variables
dotenv.config()

const app = express()

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5000',
    'http://localhost:3001',
    'https://blog-cms-iml5.onrender.com',
    'http://blog-cms-iml5.onrender.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}

// Apply CORS with configuration
app.use(cors(corsOptions))

// Middleware with increased limits
app.use(express.json({ limit: '50mb' }))
app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  })
)

// Pre-flight requests
app.options('*', cors(corsOptions))

// Test Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    console.log('Connected to Supabase successfully')
  } catch (err) {
    console.error('Supabase connection error:', err)
  }
}

testConnection()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/media', mediaRoutes)

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
