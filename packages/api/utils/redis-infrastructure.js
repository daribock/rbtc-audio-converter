import { exec } from "child_process"
import { promisify } from "util"
import logger from "./logger.js"
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_CONNECTION_CONFIG,
} from "../config/config.js"

const execAsync = promisify(exec)

/**
 * Redis Infrastructure Manager
 * Automatically manages Redis container lifecycle for development
 * Supports both Docker and Podman container runtimes
 */
class RedisInfrastructure {
  constructor(options = {}) {
    this.containerName = options.containerName || "rbtc-redis"
    this.image = options.image || "redis:7-alpine"
    this.port = options.port || REDIS_PORT.toString()
    this.host = options.host || REDIS_HOST
    this.password = options.password || REDIS_CONNECTION_CONFIG.password || ""
    this.maxRetries = options.maxRetries || 30
    this.retryDelay = options.retryDelay || 1000
    this.containerRuntime = null // Will be detected automatically
  }

  /**
   * Detect available container runtime (Docker or Podman)
   */
  async detectContainerRuntime() {
    if (this.containerRuntime) {
      return this.containerRuntime
    }

    try {
      // Try Docker first
      await execAsync("docker --version")
      this.containerRuntime = "docker"
      logger.debug("Using Docker as container runtime")

      return "docker"
    } catch (dockerError) {
      try {
        // Try Podman if Docker fails
        await execAsync("podman --version")
        this.containerRuntime = "podman"
        logger.debug("Using Podman as container runtime")

        return "podman"
      } catch (podmanError) {
        throw new Error(
          "Neither Docker nor Podman is available. Please install one of them to use auto-managed Redis.\n" +
            "Docker: https://docs.docker.com/get-docker/\n" +
            "Podman: https://podman.io/getting-started/installation",
        )
      }
    }
  }

  /**
   * Get container command prefix
   */
  async getContainerCommand() {
    const runtime = await this.detectContainerRuntime()
    return runtime
  }

  /**
   * Check if Redis container is running
   */
  async isRedisRunning() {
    try {
      const cmd = await this.getContainerCommand()
      const { stdout } = await execAsync(
        `${cmd} ps --filter name=${this.containerName} --filter status=running --format "{{.Names}}"`,
      )
      return stdout.trim() === this.containerName
    } catch (error) {
      logger.debug("Error checking Redis container status:", error.message)
      return false
    }
  }

  /**
   * Check if Redis container exists (running or stopped)
   */
  async doesRedisContainerExist() {
    try {
      const cmd = await this.getContainerCommand()
      const { stdout } = await execAsync(
        `${cmd} ps -a --filter name=${this.containerName} --format "{{.Names}}"`,
      )
      return stdout.trim() === this.containerName
    } catch (error) {
      logger.debug("Error checking Redis container existence:", error.message)
      return false
    }
  }

  /**
   * Start existing Redis container
   */
  async startExistingContainer() {
    try {
      const cmd = await this.getContainerCommand()
      logger.info(`Starting existing Redis container: ${this.containerName}`)
      await execAsync(`${cmd} start ${this.containerName}`)
      logger.info("Redis container started successfully")
      return true
    } catch (error) {
      logger.error("Failed to start existing Redis container:", error.message)
      return false
    }
  }

  /**
   * Create and start a new Redis container
   */
  async createRedisContainer() {
    try {
      const cmd = await this.getContainerCommand()
      logger.info(`Creating new Redis container: ${this.containerName}`)

      // Map external port (from config) to internal Redis port (6379)
      // Bind to localhost for security in development
      let containerCommand = `${cmd} run -d --name ${this.containerName} -p 127.0.0.1:${this.port}:6379`

      if (this.password) {
        containerCommand += ` --env REDIS_PASSWORD=${this.password}`
        // cspell:disable-next-line
        containerCommand += ` ${this.image} redis-server --requirepass ${this.password}`
      } else {
        containerCommand += ` ${this.image}`
      }

      await execAsync(containerCommand)
      logger.info("Redis container created and started successfully")
      return true
    } catch (error) {
      logger.error("Failed to create Redis container:", error.message)
      return false
    }
  }

  /**
   * Wait for Redis to be ready to accept connections
   */
  async waitForRedisReady() {
    logger.info("Waiting for Redis to be ready...")

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const cmd = await this.getContainerCommand()
        let pingCommand = `${cmd} exec ${this.containerName} redis-cli`

        if (this.password) {
          pingCommand += ` -a ${this.password}`
        }

        pingCommand += " ping"

        const { stdout } = await execAsync(pingCommand)
        if (stdout.trim() === "PONG") {
          logger.info("Redis is ready to accept connections")
          return true
        }
      } catch (error) {
        logger.debug(
          `Redis not ready yet (attempt ${i + 1}/${this.maxRetries}):`,
          error.message,
        )
      }

      await new Promise((resolve) =>
        globalThis.setTimeout(resolve, this.retryDelay),
      )
    }

    throw new Error(
      `Redis failed to become ready after ${this.maxRetries} attempts`,
    )
  }

  /**
   * Check if container runtime is available
   */
  async isContainerRuntimeAvailable() {
    try {
      await this.detectContainerRuntime()
      return true
    } catch (error) {
      logger.error("Container runtime not available:", error.message)
      return false
    }
  }

  /**
   * Main function to ensure Redis is running
   */
  async ensureRedisRunning() {
    try {
      // Check if container runtime is available
      const runtimeAvailable = await this.isContainerRuntimeAvailable()
      if (!runtimeAvailable) {
        throw new Error(
          `Container runtime is not available. Please install Docker or Podman to use auto-managed Redis.`,
        )
      }

      const runtime = await this.getContainerCommand()
      logger.info(`Using ${runtime} as container runtime`)

      // Check if Redis is already running
      const isRunning = await this.isRedisRunning()
      if (isRunning) {
        logger.info(
          `Redis container '${this.containerName}' is already running`,
        )
        return true
      }

      // Check if container exists but is stopped
      const containerExists = await this.doesRedisContainerExist()
      if (containerExists) {
        const started = await this.startExistingContainer()
        if (!started) {
          logger.info(
            "Failed to start existing container, will try to create a new one",
          )
          await this.removeContainer()
          await this.createRedisContainer()
        }
      } else {
        // Create new container
        await this.createRedisContainer()
      }

      // Wait for Redis to be ready
      await this.waitForRedisReady()

      logger.info("Redis infrastructure is ready")
      return true
    } catch (error) {
      logger.error("Failed to ensure Redis is running:", error.message)
      throw error
    }
  }

  /**
   * Remove Redis container (cleanup)
   */
  async removeContainer() {
    try {
      const cmd = await this.getContainerCommand()
      logger.info(`Removing Redis container: ${this.containerName}`)
      await execAsync(`${cmd} rm -f ${this.containerName}`)
      logger.info("Redis container removed")
    } catch (error) {
      logger.debug("Error removing container (may not exist):", error.message)
    }
  }

  /**
   * Stop Redis container
   */
  async stopRedis() {
    try {
      const isRunning = await this.isRedisRunning()
      if (isRunning) {
        const cmd = await this.getContainerCommand()
        logger.info(`Stopping Redis container: ${this.containerName}`)
        await execAsync(`${cmd} stop ${this.containerName}`)
        logger.info("Redis container stopped")
      } else {
        logger.info("Redis container is not running")
      }
    } catch (error) {
      logger.error("Failed to stop Redis container:", error.message)
    }
  }

  /**
   * Get Redis connection info
   */
  getConnectionInfo() {
    return {
      host: this.host,
      port: parseInt(this.port),
      password: this.password || undefined,
      containerName: this.containerName,
    }
  }
}

export default RedisInfrastructure
