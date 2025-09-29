# RBTC Audio Converter

A full-stack TypeScript application for converting audio files (WAV to MP3) with job queue processing, email notifications, and file management capabilities. Built with React frontend and Express.js backend.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![Express](https://img.shields.io/badge/Express-4+-green.svg)
![Redis](https://img.shields.io/badge/Redis-Alpine-red.svg)

## 🚀 Features

- **Audio Conversion**: High-quality WAV to MP3 conversion using FFmpeg
- **Queue Processing**: Background job processing with BullMQ and Redis
- **Email Notifications**: Send converted files via Nodemailer (one.com SMTP)
- **File Management**: Automatic cleanup and zip archive creation
- **Admin Dashboard**: BullMQ dashboard for monitoring jobs and queues
- **Health Checks**: Ready and live endpoints for monitoring
- **Full-Stack Integration**: React frontend served by Express backend
- **Monorepo Structure**: Organized with Lerna for package management

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Redis (for job queue)
- FFmpeg (for audio conversion)
- One.com email account (for notifications)

## 🛠 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/daribock/rbtc-audio-converter-backend.git
cd rbtc-audio-converter-backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Application Configuration
BASE_URL=http://localhost:8000
PORT=8000
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=

# Email Configuration (One.com SMTP)
MAIL_USER=your-email@yourdomain.com
MAIL_PASS=your-email-password

# Authentication
PASSPORT_USERNAME=admin
PASSPORT_PASSWORD=your_secure_password
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up

# Or start in background
docker-compose up -d
```

### 4. Access the Application

- **Main Application**: http://localhost:8000
- **Admin Dashboard**: http://localhost:8000/admin
- **Health Check**: http://localhost:8000/health/ready

## 🏗 Project Structure

```
rbtc-audio-converter-backend/
├── packages/
│   ├── frontend/               # React + TypeScript + Vite
│   └── api/                    # Express.js backend
│       ├── app.js               # Main application entry
│       ├── worker.js            # Background worker
│       ├── config/              # Configuration
│       ├── controllers/         # Request handlers
│       ├── middlewares/         # Express middlewares
│       ├── processors/          # Job processors
│       ├── queues/              # Queue definitions
│       ├── routes/              # API routes
│       ├── utils/               # Backend utilities
│       └── views/               # EJS templates
├── docker-compose.yml          # Docker services
├── lerna.json                  # Lerna configuration
└── package.json               # Root workspace
```

## 🚀 Development

### Local Development

```bash
# Start Redis
docker run -d -p 6380:6380 --name rbtc-redis redis:alpine

# Start development servers (frontend + backend)
npm run dev

# Or start individually
cd packages/api && npm run dev        # Backend only
cd packages/frontend && npm run dev   # Frontend only
```

### Available Scripts

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | Start both frontend and backend in development mode |

## 🔄 How It Works

1. **Upload**: Users upload WAV files through the React frontend
2. **Queue**: Files are queued for processing using BullMQ
3. **Convert**: Background workers convert WAV to MP3 using FFmpeg
4. **Archive**: Converted files are compressed into a ZIP archive
5. **Email**: Download link is sent via Nodemailer to user's email
6. **Cleanup**: Files are automatically deleted after 3 days

## 📡 API Endpoints

### Health & Status

- `GET /health/ready` - Application readiness check
- `GET /health/live` - Application liveness check

### File Operations

- `POST /upload/files` - Upload WAV files for conversion
- `POST /upload/complete` - Complete upload session
- `POST /convert` - Start audio conversion process
- `GET /download/:jobId/:fileName` - Download converted files

### Administration

- `GET /admin` - BullMQ dashboard (requires authentication)
- `POST /admin/login` - Admin login

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

The application uses Redis for job queue management:

- **Host**: `localhost` (development) / `redis` (Docker)
- **Port**: `6380`
- **Password**: Optional (set via `REDIS_PASSWORD`)

### Email Configuration

Using Nodemailer with one.com SMTP:

- **Service**: One.com
- **Authentication**: Username/Password
- **Security**: TLS/SSL support

### File Upload Limits

- **Max file size**: 100MB per file
- **Supported formats**: WAV files
- **Output format**: MP3 (high quality)

## 📊 Monitoring

### BullMQ Dashboard

Access the admin dashboard at `/admin` to monitor:

- Active jobs and queues
- Failed job retry mechanisms
- Job processing statistics
- Queue performance metrics

### Health Checks

Use the health endpoints for monitoring:

```bash
# Check application health
curl http://localhost:8000/health/ready

# Check liveness
curl http://localhost:8000/health/live
```

## 🔐 Security Features

- **Helmet.js**: Security headers middleware
- **CORS**: Configurable cross-origin resource sharing
- **Session Management**: Secure session handling
- **Authentication**: Passport.js for admin access
- **Input Validation**: File type and size validation
- **Environment Variables**: Secure configuration management

## 🧪 Testing

```bash
# Run linting
npm run lint

# Format code
npm run format

# Test file upload
curl -X POST -F "file=@test.wav" http://localhost:8000/upload/files

# Test health endpoint
curl http://localhost:8000/health/ready
```

## 📝 Environment Variables

### Required Variables

| Variable    | Description            | Example                  |
| ----------- | ---------------------- | ------------------------ |
| `BASE_URL`  | Application base URL   | `http://localhost:8000`  |
| `MAIL_USER` | One.com email address  | `noreply@yourdomain.com` |
| `MAIL_PASS` | One.com email password | `your-secure-password`   |

### Optional Variables

| Variable     | Description      | Default       |
| ------------ | ---------------- | ------------- |
| `PORT`       | Application port | `8000`        |
| `REDIS_HOST` | Redis hostname   | `localhost`   |
| `REDIS_PORT` | Redis port       | `6380`        |
| `NODE_ENV`   | Environment mode | `development` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use ESLint and Prettier for code formatting
- Follow TypeScript best practices for frontend
- Write descriptive commit messages
- Test your changes locally before submitting

## 🆘 Troubleshooting

### Common Issues

**CORS Errors**

- Ensure CORS is enabled in development mode
- Check allowed origins in `app.js`

**Redis Connection Failed**

- Verify Redis is running: `docker ps`
- Check Redis port and host configuration

**Email Not Sending**

- Verify one.com SMTP credentials
- Check email environment variables

**File Upload Issues**

- Ensure file size is under 100MB
- Verify file format is WAV
- Check disk space availability

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development npm run dev
```

View application logs:

```bash
# Docker logs
docker-compose logs -f node-api

# Local logs
tail -f logs/combined.log
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Darius Kletter**

- Email: [darikletter@gmail.com](mailto:darikletter@gmail.com)
- GitHub: [@daribock](https://github.com/daribock)

## 🙏 Acknowledgments

- Built with Express.js and React
- Audio conversion powered by FFmpeg
- Job processing with BullMQ
- Email delivery via Nodemailer
- UI components from Ant Design

---

## 🚀 Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Development mode
npm run dev

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Health check
curl http://localhost:8000/health/ready
```

For more detailed documentation, see the [BUILD.md](BUILD.md) file.
