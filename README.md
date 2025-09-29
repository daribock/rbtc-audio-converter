# RBTC Audio Converter

A full-stack TypeScript application for converting audio files (WAV to MP3) with job queue processing, email notifications, and file management capabilities. Built with React frontend and Express.js backend.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![Express](https://img.shields.io/badge/Express-4+-green.svg)
![Redis](https://img.shields.io/badge/Redis-Alpine-red.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5+-purple.svg)

## 🚀 Features

### 🎵 Audio Processing

- **High-Quality Audio Conversion**: WAV to MP3 conversion using FFmpeg with 192k bitrate
- **Automatic Silence Removal**: Removes silence from the end of recordings
- **Metadata Enhancement**: Adds ID3v2.4 tags (artist, title, album, track number, year)
- **Cover Art Support**: Automatically embeds logo/artwork into MP3 files
- **Batch Processing**: Handle multiple files simultaneously (up to 15 files)

### 🔄 Job Queue System

- **Background Processing**: BullMQ-powered job queues with Redis
- **Flow-Based Processing**: Orchestrated job flows with dependencies
- **Error Handling**: Automatic retry mechanisms and failure management
- **Progress Tracking**: Real-time progress updates for file processing
- **Cleanup Automation**: Automatic file cleanup after 3 days

### 📧 Communication & Delivery

- **Email Notifications**: One.com SMTP integration for delivery notifications
- **ZIP Archive Creation**: Compressed downloads for easy file management
- **Secure Download Links**: Time-limited download access
- **User-Friendly Interface**: React-based frontend with Ant Design components

### 🛠 Infrastructure & DevOps

- **Auto-Managed Redis**: Automatic Redis container management for development
- **Docker & Podman Support**: Multi-runtime container support
- **Health Monitoring**: Comprehensive health checks and monitoring endpoints
- **Admin Dashboard**: BullMQ web interface for queue management
- **Monorepo Structure**: Organized with Lerna for package management
- **Hot Reload Development**: Vite-powered frontend with fast refresh

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and Docker Compose (for containerized deployment)
- **Podman** (alternative to Docker, auto-detected)
- **FFmpeg** (for audio conversion - auto-installed in containers)
- **One.com email account** (for email notifications)

## 🛠 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/daribock/rbtc-audio-converter.git
cd rbtc-audio-converter
npm install
```

### 2. Environment Setup

Create a `.env` file in the `packages/api/` directory:

```env
# Application Configuration
BASE_URL=http://localhost:8000
PORT=8000
NODE_ENV=development

# Redis Configuration (Auto-managed in development)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=

# Email Configuration (One.com SMTP)
MAIL_USER=your-email@yourdomain.com
MAIL_PASS=your-email-password

# Authentication (BullMQ Dashboard)
PASSPORT_USERNAME=admin
PASSPORT_PASSWORD=your_secure_password
```

### 3. Start with Docker (Recommended)

```bash
# Start all services (Redis + Node.js app)
docker-compose up

# Or start in background
docker-compose up -d

# For production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Local Development (Alternative)

```bash
# The app will auto-start Redis container for you
npm run dev

# Or start services individually
cd packages/api && npm run dev        # Backend only
cd packages/frontend && npm run dev   # Frontend only (port 3001)
```

### 5. Access the Application

- **Main Application**: http://localhost:8000
- **Admin Dashboard**: http://localhost:8000/admin/queues (login: admin/your_password)
- **Health Check**: http://localhost:8000/api/health/ready
- **Frontend Dev Server**: http://localhost:3001 (if running separately)

## 🏗 Project Structure

```
rbtc-audio-converter/
├── packages/
│   ├── frontend/                    # React + TypeScript + Vite
│   │   ├── src/
│   │   │   ├── components/          # React components
│   │   │   │   ├── Content.tsx      # Main content component
│   │   │   │   ├── UploadForm.tsx   # File upload with progress
│   │   │   │   └── MetadataForm.tsx # Metadata input form
│   │   │   ├── types/               # TypeScript definitions
│   │   │   ├── utils/               # API utilities
│   │   │   └── App.tsx              # Main app component
│   │   ├── vite.config.ts           # Vite configuration
│   │   └── package.json             # Frontend dependencies
│   ├── api/                         # Express.js backend
│   │   ├── app.js                   # Main application entry
│   │   ├── index.js                 # Server startup with infrastructure
│   │   ├── worker.js                # Background worker definitions
│   │   ├── config/                  # Configuration files
│   │   ├── controllers/             # Request handlers
│   │   ├── middlewares/             # Express middlewares
│   │   ├── processors/              # BullMQ job processors
│   │   │   ├── file-processor.js    # Audio conversion logic
│   │   │   ├── zip-folder-processor.js # Archive creation
│   │   │   ├── send-email-processor.js # Email notifications
│   │   │   └── cleanup-processor.js # File cleanup
│   │   ├── queues/                  # Queue definitions
│   │   ├── routes/                  # API route definitions
│   │   ├── utils/                   # Backend utilities
│   │   │   ├── redis-infrastructure.js # Auto Redis management
│   │   │   ├── email.js             # Email service
│   │   │   ├── file.js              # File operations
│   │   │   └── logger.js            # Winston logging
│   │   └── views/                   # EJS templates
│   └── docs/                        # Documentation
│       ├── rbtc-audio-converter-guide.md
│       └── redis-infrastructure.md
├── scripts/                         # Utility scripts
│   └── rbtc-audio-converter.sh      # Standalone conversion script
├── config/                          # Redis configurations
├── docker-compose.yml              # Docker services
├── docker-compose.prod.yml         # Production overrides
├── Dockerfile                      # Container build instructions
├── lerna.json                      # Lerna monorepo config
└── package.json                   # Root workspace
```

## 🚀 Development

### Local Development Options

#### Option 1: Full Auto-Managed (Recommended)

```bash
# Automatically starts Redis container and both frontend/backend
npm run dev
```

#### Option 2: Manual Container Management

```bash
# Start Redis manually
docker run -d -p 6380:6380 --name rbtc-redis redis:7-alpine

# Start both services
npm run dev

# Or start individually
cd packages/api && npm run dev        # Backend (port 8000)
cd packages/frontend && npm run dev   # Frontend (port 3001)
```

#### Option 3: Docker Development

```bash
docker-compose up --build
```

## 🔄 How It Works

1. **Upload**: Users upload WAV files through the React frontend
2. **Queue**: Files are queued for processing using BullMQ
3. **Convert**: Background workers convert WAV to MP3 using FFmpeg
4. **Archive**: Converted files are compressed into a ZIP archive
5. **Email**: Download link is sent via Nodemailer to user's email
6. **Cleanup**: Files are automatically deleted after 3 days

## 📡 API Endpoints

### Health & Status

- `GET /api/health/ready` - Application readiness check with service status
- `GET /api/health/live` - Application liveness check (simple ping)
- `GET /api/health/` - Detailed health check with Redis and filesystem status

### File Operations

- `GET /upload/status` - Check upload status for resumable uploads
  - Headers: `x-job-id`, `x-file-name`, `file-size`
- `POST /upload/files` - Upload WAV files with chunked support
  - Headers: `x-job-id`, `x-file-name`, `content-range`, `file-size`
- `GET /upload/complete` - Mark file upload as complete
  - Headers: `x-job-id`, `x-file-name`
- `POST /convert/files` - Start audio conversion job flow
  - Body: `{ jobId, subject, email, city, teacher }`
- `GET /download/:jobId/:fileName` - Download processed files

### Administration

- `GET /admin/queues` - BullMQ dashboard (requires authentication)
- `GET /admin/login` - Admin login page
- `POST /admin/login` - Admin authentication

### Frontend Routes (SPA)

- `GET /` - Main application interface
- `GET /*` - React Router handles client-side routing

## 🐳 Docker Deployment

### Development Environment

```bash
docker-compose up
```

### Production Environment

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Build Custom Image

```bash
# Build production image
docker build -t rbtc-audio-converter -f packages/api/Dockerfile .

# Run container
docker run -p 8000:8000 --env-file .env rbtc-audio-converter
```

## 🔧 Configuration

### Redis Configuration

The application features **automatic Redis management** for development:

- **Auto-Detection**: Detects Docker or Podman automatically
- **Container Management**: Creates and manages Redis container lifecycle
- **Development**: Auto-starts Redis on `localhost:6380`
- **Production**: Expects external Redis service
- **Health Monitoring**: Waits for Redis readiness before starting

#### Redis Settings

```env
REDIS_HOST=localhost          # Default: localhost (dev) / redis (Docker)
REDIS_PORT=6380              # Default: 6380
REDIS_PASSWORD=              # Optional in development, required in production
```

### Email Configuration

Using Nodemailer with **One.com SMTP**:

```env
MAIL_USER=your-email@yourdomain.com    # One.com email address
MAIL_PASS=your-email-password          # One.com email password
```

**Features:**

- **Service**: One.com SMTP integration
- **Authentication**: Username/Password
- **Security**: TLS/SSL support
- **Email Templates**: HTML templates with styling
- **Download Links**: Secure, time-limited access

### File Upload & Processing

#### Upload Limits

- **Max file size**: 100MB per file
- **Max files per session**: 15 files
- **Supported input formats**: WAV, MP3
- **Output format**: MP3 (192k bitrate, ID3v2.4 tags)

#### Processing Features

- **Chunked Uploads**: Resumable file uploads
- **Progress Tracking**: Real-time upload progress
- **Metadata Extraction**: Automatic date/time parsing from filenames
- **File Naming**: Format: `YYMMDD SUBJECT ## CITY TEACHER.mp3`
- **Cover Art**: Automatic logo embedding

### Infrastructure Settings

#### Container Runtime Support

- **Docker**: Primary container runtime (auto-detected)
- **Podman**: Alternative runtime (fallback)
- **Auto-Management**: Only in development mode
- **External Redis**: Required for production deployments

#### Application Settings

```env
NODE_ENV=development         # development | production
PORT=8000                   # Application port
BASE_URL=http://localhost:8000  # Base URL for download links
START_INFRASTRUCTURE=true   # Enable auto Redis management
```


## 📚 Additional Resources

- **[Standalone Script Guide](packages/docs/rbtc-audio-converter-guide.md)** - Universal WAV to MP3 conversion script for Windows/macOS/Linux
- **[Redis Infrastructure Documentation](packages/docs/redis-infrastructure.md)** - Auto-managed Redis setup details
- **[Frontend Package](packages/frontend/README.md)** - React + TypeScript + Vite setup
- **[Backend Package](packages/api/README.md)** - Express.js API documentation
