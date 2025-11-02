const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const morgan = require("morgan")
require("dotenv").config()

// Import routes
const patientRoutes = require("./routes/patients")
const vitalsRoutes = require("./routes/vitals")
const alertsRoutes = require("./routes/alerts")
const thresholdsRoutes = require("./routes/thresholds")

// Import services
const mockDataService = require("./services/mockDataService")
const seedService = require("./services/seedService")

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration - Allow all origins for development
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(morgan("combined"))

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/iv-monitoring"

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB")
    console.log(`📍 Database: ${MONGODB_URI}`)

    // Initialize seed data
    await seedService.initializeData()

    // Start mock data generation
    mockDataService.startMockDataGeneration()
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error)
    console.log("💡 Make sure MongoDB is running on localhost:27017")
    process.exit(1)
  })

// Routes
app.use("/api/patients", patientRoutes)
app.use("/api/vitals", vitalsRoutes)
app.use("/api/alerts", alertsRoutes)
app.use("/api/thresholds", thresholdsRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "IV Monitoring API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "IV Monitoring Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      patients: "/api/patients",
      vitals: "/api/vitals",
      alerts: "/api/alerts",
      thresholds: "/api/thresholds",
    },
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
  })
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  mockDataService.stopMockDataGeneration()
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  mockDataService.stopMockDataGeneration()
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed")
    process.exit(0)
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`)
  console.log(`🏥 Ready to serve IV Monitoring Frontend!`)
})

module.exports = app
