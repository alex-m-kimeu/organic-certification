# 🌱 Organic Certification Management System

A comprehensive full-stack application for managing organic farm certification processes. This system provides an intuitive interface for farmers, inspectors, and administrators to manage certifications, conduct inspections, track farm data, and generate compliance certificates.

## 🚀 Live Demo

- **Application**: [https://organiccertifications.online/](https://organiccertifications.online/)
- **API Documentation**: [https://organiccertifications.online/api/docs](https://organiccertifications.online/api/docs)

## 🎥 Demo Video

### Sample Application Walkthrough

https://github.com/user-attachments/assets/b788dc30-e833-4fb9-ba53-add10b6da857

_A comprehensive demo showcasing the complete organic certification workflow including farmer registration, farm management, field tracking, inspection processes, and certificate generation. For a complete experince visit the live link above☝🏾 and have fun interating with it_

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Next.js 15 React application with TypeScript
- **Backend**: Node.js/Express API with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Cloudinary for PDF certificates and file management with local storage as fallback
- **Deployment**: Docker containers on Digital Ocean

## ✨ Features

### Core Functionality

- **Farmer Management**: Register and manage farmer profiles with contact information
- **Farm & Field Tracking**: Organize farms by location and track individual field crops
- **Inspection System**: Comprehensive inspection workflows with compliance scoring
- **Certificate Generation**: Automated PDF certificate generation with cloud storage and local storage as fallback
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Dark/Light Theme**: Built-in theme switching with system preference detection

### Technical Features

- **RESTful API**: Well-documented API endpoints with Swagger/OpenAPI
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Database Management**: PostgreSQL with Prisma ORM and migrations
- **Security**: Rate limiting, CORS, Helmet security headers, input validation
- **Testing**: Comprehensive Jest test suites with coverage reporting
- **Docker Support**: Complete containerization for development and production

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (for local development)
- npm or yarn package manager
- Docker and Docker Compose (for container deployment)

## 🖥️ Local Development (Without Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/alex-m-kimeu/organic-certification.git
cd organic-certification
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 3. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb organic_certification

# Set up environment variables (backend/.env)
cp backend/.env.example backend/.env
```

Configure `backend/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/organic_certification
PORT=8080
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
BASE_URL=http://localhost:8080
API_BASE_URL=http://localhost:8080
```

#### Option B: Docker Database Only

```bash
# Start only the database service
docker compose -f docker-compose.dev.yml up db -d
```

### 4. Frontend Configuration

```bash
# Set up frontend environment
cp frontend/.env.example frontend/.env
```

Configure `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 5. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # Optional: seed with sample data
cd ..
```

### 6. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

The application will be available at:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8080](http://localhost:8080)
- API Documentation: [http://localhost:8080/api/docs](http://localhost:8080/api/docs)

## 🐳 Docker Development

### Development Environment

```bash
# Clone repository
git clone https://github.com/alex-m-kimeu/organic-certification.git
cd organic-certification

# Copy environment file
cp .env.example .env

# Configure environment variables
nano .env
```

Configure `.env`:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=organic_certification
DB_PORT=5432
TEST_DB_PORT=5433

# Application URLs
NEXT_PUBLIC_API_URL=http://localhost:8080/api
ALLOWED_ORIGINS=http://localhost:3000
BASE_URL=http://localhost:8080

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Start Development Environment

```bash
# Build containers first
docker compose -f docker-compose.dev.yml build

# Start all services (database, backend, frontend)
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

### Development Commands

```bash
# Stop all services
docker compose -f docker-compose.dev.yml down

# Rebuild and start
docker compose -f docker-compose.dev.yml up --build

# Start only specific services
docker compose -f docker-compose.dev.yml up db backend

# Clean up development environment
docker compose -f docker-compose.dev.yml down
docker system prune -a -f
```

## 🚀 Production Docker Deployment

### Build and Deploy

```bash
# Build containers first
docker compose build

# Production deployment
docker compose up -d

# View production logs
docker compose logs -f

# Scale services (optional)
docker compose up -d --scale backend=2

# Stop services
docker compose down

# Clean up (removes containers, networks, images, and build cache)
docker system prune -a -f
```

### Production Configuration

Configure production `.env`:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong_production_password
POSTGRES_DB=organic_certification

# Application URLs
NEXT_PUBLIC_API_URL=https://your-domain.com/api
ALLOWED_ORIGINS=https://your-domain.com
BASE_URL=https://your-domain.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_production_cloud
CLOUDINARY_API_KEY=your_production_key
CLOUDINARY_API_SECRET=your_production_secret
```

## 📜 Available Scripts

### Root Level Commands

```bash
# Development
npm run dev          # Start both frontend and backend in development
npm run build        # Build both applications for production
npm start           # Start both applications in production mode

# Code Quality
npm run lint        # Lint both frontend and backend
npm run format      # Format all files with Prettier
npm run fix         # Format and fix all linting issues
npm run type-check  # TypeScript type checking

# Testing
npm test           # Run all tests
npm run test:backend    # Run backend tests only
npm run test:frontend   # Run frontend tests only
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage reports
```

### Individual Service Commands

```bash
# Backend commands
cd backend
npm run dev         # Development server with hot reload
npm run build       # Build for production
npm start          # Start production server
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio

# Frontend commands
cd frontend
npm run dev         # Development server with hot reload
npm run build       # Build for production
npm start          # Start production server
```

## 🗂️ Project Structure

```text
organic-certification/
├── README.md                    # This file
├── package.json                 # Root package configuration
├── docker-compose.yml           # Production Docker configuration
├── docker-compose.dev.yml       # Development Docker configuration
├── .prettierrc                  # Code formatting configuration
├── .prettierignore              # Files ignored by Prettier
├── .env.example                 # Environment variables template
│
├── frontend/                    # Next.js React application
│   ├── README.md               # Frontend documentation
│   ├── package.json            # Frontend dependencies
│   ├── app/                    # Next.js App Router
│   ├── components/             # React components
│   ├── lib/                    # Utilities and validations
│   └── types/                  # TypeScript definitions
│
├── backend/                     # Node.js/Express API
│   ├── README.md               # Backend documentation
│   ├── package.json            # Backend dependencies
│   ├── prisma/                 # Database schema and migrations
│   ├── src/                    # Source code
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── routes/             # API routes
│   │   ├── middlewares/        # Custom middleware
│   │   ├── config/             # Configuration files
│   │   └── utils/              # Utility functions
│   └── tests/                  # Test files
└── storage/                    # Local file storage
```

## 🔧 Configuration

### Environment Variables

| Variable              | Description                  | Example                               |
| --------------------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_API_URL` | Frontend API endpoint        | `http://localhost:8080/api`           |
| `ALLOWED_ORIGINS`     | CORS allowed origins         | `http://localhost:3000`               |
| `CLOUDINARY_*`        | Cloudinary configuration     | Required for file storage             |
| `NODE_ENV`            | Environment mode             | `development` or `production`         |

### Database Management

```bash
# Generate Prisma client
cd backend && npm run prisma:generate

# Run migrations
cd backend && npm run prisma:migrate

# Reset database
cd backend && npm run prisma:reset

# Open database GUI
cd backend && npm run prisma:studio

# Seed database
cd backend && npm run prisma:seed
```

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Backend tests with coverage
cd backend && npm run test:coverage

# Frontend tests with coverage
cd frontend && npm run test:coverage

# Watch mode during development
npm run test:watch
```

### Test Structure

- **Backend**: API endpoint tests, service layer tests, utility tests
- **Frontend**: Component tests, integration tests, utility tests
- **Coverage**: Minimum 70% coverage threshold maintained

## 🚀 Deployment

### Digital Ocean Deployment

The application is currently deployed on Digital Ocean using Docker containers:

1. **Droplet Setup**: Ubuntu server with Docker and Docker Compose
2. **SSL Certificate**: Let's Encrypt with automatic renewal
3. **Reverse Proxy**: Nginx for routing and load balancing
4. **Database**: PostgreSQL container with persistent volumes
5. **Storage**: Cloudinary for PDF certificates and file management

### Manual Deployment Steps

```bash
# 1. Clone repository on server
git clone https://github.com/alex-m-kimeu/organic-certification.git
cd organic-certification

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Build containers
docker compose build

# 4. Start services
docker compose up -d

# 5. Initialize database
docker compose exec backend npm run prisma:migrate
```

## 🔒 Security

### Implemented Security Measures

- **Input Validation**: Zod schema validation on all API inputs
- **Rate Limiting**: Request throttling per IP address
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Error Handling**: Sanitized error responses
- **File Upload Security**: Cloudinary integration for secure file handling
- **Environment Variables**: Sensitive data stored securely

## 🤝 Contributing

### Development Workflow

1. **Fork and clone the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install`
4. **Set up development environment** (local or Docker)
5. **Make changes and add tests**
6. **Run quality checks**: `npm run fix && npm test`
7. **Commit changes**: `git commit -m 'Add amazing feature'`
8. **Push to branch**: `git push origin feature/amazing-feature`
9. **Open a Pull Request**

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Extended configurations for Next.js and Node.js
- **Prettier**: Consistent code formatting
- **Testing**: Maintain test coverage above 70%
- **Conventional Commits**: Use conventional commit messages

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps

# View database logs
docker compose -f docker-compose.dev.yml logs db

# Reset database connection
docker compose -f docker-compose.dev.yml restart db
```

#### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
lsof -i :5432  # PostgreSQL

# Kill processes using ports
kill $(lsof -ti :3000)
```

#### Docker Issues

```bash
# Stop all containers
docker compose -f docker-compose.dev.yml down

# Clean up Docker resources (removes containers, networks, images, and build cache)
docker system prune -a -f

# Rebuild containers from scratch
docker compose -f docker-compose.dev.yml build --no-cache

# Start services after rebuild
docker compose -f docker-compose.dev.yml up -d

# View container logs
docker compose -f docker-compose.dev.yml logs [service-name]
```

#### Environment Variable Issues

```bash
# Verify environment variables are loaded
docker compose config

# Check environment inside container
docker compose exec backend env
docker compose exec frontend env
```

### Getting Help

1. **Check documentation**: Review backend and frontend README files
2. **API Documentation**: Visit `/api/docs` for interactive API documentation
3. **Logs**: Check application logs for detailed error messages
4. **Issues**: Open an issue on the GitHub repository

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework for the frontend
- **Express.js** - Node.js web framework for the backend
- **Prisma** - Database ORM and query builder
- **PostgreSQL** - Relational database system
- **Cloudinary** - Primary cloud-based file storage and management
- **Digital Ocean** - Cloud infrastructure provider

---

Built with ❤️ for sustainable agriculture and organic farming certification processes.
