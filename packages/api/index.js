import process from "process"
import RedisInfrastructure from "./utils/redis-infrastructure.js"
import logger from "./utils/logger.js"

async function startInfrastructure() {
  try {
    // Initialize Redis infrastructure using config values
    const redisInfra = new RedisInfrastructure({
      containerName: "rbtc-redis",
      // port, host, and password will be read from config.js defaults
    })

    // Only auto-start Redis in development mode
    if (process.env.START_INFRASTRUCTURE === "true") {
      logger.info("Ensuring Redis is available..." + process.env.NODE_ENV)
      await redisInfra.ensureRedisRunning()
      const connectionInfo = redisInfra.getConnectionInfo()
      logger.info(
        `Redis is ready at ${connectionInfo.host}:${connectionInfo.port}`,
      )
    }

    // Dynamically import and start the server after Redis is ready
    const { startServer } = await import("./app.js")
    await startServer()
  } catch (error) {
    logger.error("Redis infrastructure error:", error)

    // In development, provide helpful error message
    if (process.env.START_INFRASTRUCTURE === "true") {
      logger.info("Tips:")
      logger.info("1. Make sure Docker or Podman is installed and running")
      logger.info(
        "2. Or start Redis manually: docker run -d --name rbtc-redis -p 6379:6379 redis:7-alpine",
      )
      logger.info("3. Or use external Redis and set NODE_ENV=production")
    }

    process.exit(1)
  }
}

startInfrastructure()
