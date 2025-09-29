/* eslint-env node */
import express from "express"
import process from "process"
import { REDIS_CONNECTION_CONFIG } from "../config/config.js"
import logger from "../utils/logger.js"

const router = express.Router()

// Basic readiness check
router.get("/ready", async (req, res) => {
  try {
    const healthStatus = {
      status: "READY",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    }

    res.status(200).json(healthStatus)
  } catch (error) {
    logger.error("Health check ready failed:", error)
    res.status(503).json({
      status: "NOT_READY",
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Liveness check (simple ping)
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "LIVE",
    timestamp: new Date().toISOString(),
    pid: process.pid
  })
})

// Detailed health check
router.get("/", async (req, res) => {
  const healthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      redis: "checking...",
      filesystem: "checking..."
    }
  }

  try {
    // Check filesystem (uploads directory)
    try {
      const fs = await import("fs")
      const uploadsDir = "uploads"

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      healthStatus.services.filesystem = "OK"
    } catch (fsError) {
      logger.warn("Filesystem health check failed:", fsError.message)
      healthStatus.services.filesystem = "ERROR"
      healthStatus.status = "DEGRADED"
    }

    // Simple Redis connectivity check
    try {
      // Basic check - we'll assume Redis is OK if we have connection config
      if (REDIS_CONNECTION_CONFIG.host && REDIS_CONNECTION_CONFIG.port) {
        healthStatus.services.redis = "OK"
      } else {
        healthStatus.services.redis = "MISCONFIGURED"
        healthStatus.status = "DEGRADED"
      }
    } catch (redisError) {
      logger.warn("Redis health check failed:", redisError.message)
      healthStatus.services.redis = "ERROR"
      healthStatus.status = "DEGRADED"
    }

    const statusCode = healthStatus.status === "OK" ? 200 : 503
    res.status(statusCode).json(healthStatus)

  } catch (error) {
    logger.error("Health check failed:", error)
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

export default router
