# Redis Infrastructure Auto-Management

This project includes automatic Redis infrastructure management for development environments with support for both **Docker** and **Podman** container runtimes.

## Features

- **Multi-Runtime Support**: Automatically detects and uses Docker or Podman
- **Auto-Start**: Automatically starts a Redis container when the application starts
- **Skip if Running**: Detects if Redis is already running and skips container creation
- **Environment Aware**: Only auto-manages Redis in development mode
- **Container Integration**: Uses containerized Redis for isolated instances
- **Health Checks**: Waits for Redis to be ready before starting the application

## How It Works

### Automatic Management (Development)

When you start the application in development mode:

```bash
npm start
# or
npm run dev
```

The application will:

1. Check if Docker or Podman is available (tries Docker first, then Podman)
2. Look for an existing Redis container named `rbtc-redis`
3. Start the container if it exists but is stopped
4. Create a new Redis container if none exists
5. Wait for Redis to be ready to accept connections
6. Start the Express server

### Production Mode

In production, set `NODE_ENV=production` and the application will:

- Skip automatic Redis management
- Expect Redis to be available externally
- Log helpful messages about Redis configuration

```bash
npm run start:production
```

## Configuration

Configure Redis infrastructure using environment variables in your `.env` file or system environment:

```bash
# Redis connection settings (used by both infrastructure and application)
REDIS_HOST=127.0.0.1              # Default: 0.0.0.0
REDIS_PORT=6380                   # Default: 6380
REDIS_PASSWORD=your_password      # Default: none (development), required (production)

# Application settings
NODE_ENV=development              # development | production
```

The Redis infrastructure automatically reads configuration from `config/config.js`, which processes these environment variables and provides consistent settings across the application.

## Container Runtime Requirements

For automatic Redis management, you need one of:

- **Docker**: Install from [docker.com](https://docs.docker.com/get-docker/)
- **Podman**: Install from [podman.io](https://podman.io/getting-started/installation)

The system automatically detects which one is available:

1. Tries Docker first
2. Falls back to Podman if Docker is not found
3. Provides helpful error messages if neither is available

## Troubleshooting

### Container Runtime Not Available

If you see errors about container runtime not being available:

```bash
# Check if Docker is installed
docker --version

# Check if Podman is installed (alternative)
podman --version

# Check if container runtime daemon is running
docker ps  # or: podman ps
```

### Port Conflicts

If port 6379 is already in use:

1. Set a different port:

   ```bash
   REDIS_PORT=6380 npm start
   ```

2. Or stop the conflicting service:
   ```bash
   # Find what's using the port
   lsof -i :6379
   ```

### Permission Issues

If you get Docker permission errors:

1. Add your user to the docker group:

   ```bash
   sudo usermod -aG docker $USER
   ```

2. Or use Docker Desktop (macOS/Windows)

## Manual Redis Setup

If you prefer to manage Redis yourself:

### Using Docker

```bash
# Start Redis container manually
docker run -d --name rbtc-redis -p 6379:6379 redis:7-alpine

# With password
docker run -d --name rbtc-redis -p 6379:6379 \
  --env REDIS_PASSWORD=yourpassword \
  redis:7-alpine redis-server --requirepass yourpassword
```

### Using Local Installation

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Then start the app in production mode
NODE_ENV=production npm start
```

## Container Lifecycle

The Redis infrastructure manager handles:

- **Container Creation**: Creates new Redis containers with proper configuration
- **Container Reuse**: Reuses existing containers instead of creating duplicates
- **Health Monitoring**: Waits for Redis to be ready before proceeding
- **Graceful Shutdown**: Handles application shutdown signals

## Security Notes

- Default Redis configuration has no password (development only)
- Set `REDIS_PASSWORD` for password protection
- Use external Redis services in production
- Container is bound to localhost only (`127.0.0.1:6379`)
