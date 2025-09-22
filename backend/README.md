# Organic Certification Backend API

A comprehensive Node.js/Express backend API for managing organic farm certification processes. This system handles farmer registration, farm management, field tracking, inspection workflows, and certificate generation with PDF export capabilities.

## 🌱 Features

- **Farmer Management**: Register and manage farmer profiles with contact information
- **Farm & Field Tracking**: Organize farms by location and track individual field crops
- **Inspection System**: Comprehensive inspection workflows with compliance scoring
- **Certificate Generation**: Automated PDF certificate generation with cloud storage and local storage as fallback
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Database Management**: PostgreSQL with Prisma ORM
- **Security**: Rate limiting, CORS, Helmet security headers
- **Testing**: Jest test suite with coverage reporting
- **Cloud Integration**: Cloudinary for file storage and PDF management

## 🏗️ Architecture

### Database Schema

- **Farmers**: Personal information and contact details
- **Farms**: Farm properties linked to farmers
- **Fields**: Individual crop fields within farms
- **Inspections**: Inspection records with status tracking
- **Certificates**: Generated compliance certificates
- **Checklist Questions**: Configurable inspection criteria

### API Endpoints

- `/api/farmers` - Farmer CRUD operations
- `/api/farms` - Farm management
- `/api/fields` - Field tracking
- `/api/inspections` - Inspection workflows
- `/api/certificates` - Certificate generation and retrieval
- `/api/docs` - Interactive API documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16 database
- npm or yarn package manager

### Installation

1. **Clone and navigate to backend**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with:

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

4. **Database setup**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # Seed initial data - checklist questions (optional)
   npm run prisma:seed
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:8080` with documentation at `http://localhost:8080/api/docs`.

## 📜 Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Database

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:seed` - Seed database with initial data
- `npm run prisma:reset` - Reset database and re-run migrations

### Code Quality

- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run fix` - Auto-fix linting and formatting issues
- `npm run type-check` - TypeScript type checking

### Testing

- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:ci` - Run tests for CI/CD
- `npm run test:setup` - Setup test database

### Utilities

- `npm run clean` - Remove build artifacts
- `npm run clean-install` - Fresh install of dependencies

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

### Farmer

```prisma
model Farmer {
  id     String @id @default(cuid())
  name   String
  phone  String @unique
  email  String @unique
  county String
  farms  Farm[]
}
```

### Farm

```prisma
model Farm {
  id       String @id @default(cuid())
  farmerId String
  farmName String
  location String
  areaHa   Float
  farmer   Farmer @relation(fields: [farmerId], references: [id])
  fields   Field[]
  inspections Inspection[]
  certificates Certificate[]
}
```

### Inspection

```prisma
model Inspection {
  id              String @id @default(cuid())
  farmId          String
  date            DateTime @default(now())
  inspectorName   String
  status          InspectionStatus @default(DRAFT)
  complianceScore Float?
  farm            Farm @relation(fields: [farmId], references: [id])
  checklist       InspectionChecklist[]
}
```

## 🔧 Configuration

### Environment Variables

| Variable          | Description                        | Default                  |
| ----------------- | ---------------------------------- | ------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string       | Required                 |
| `PORT`            | Server port                        | 8080                     |
| `NODE_ENV`        | Environment mode                   | development              |
| `ALLOWED_ORIGINS` | CORS allowed origins               | localhost:3000           |
| `CLOUDINARY_*`    | Cloudinary config for file storage | Required for PDF storage |
| `BASE_URL`        | Base URL for file serving          | `http://localhost:8080`  |
| `API_BASE_URL`    | API base URL for Swagger           | `http://localhost:8080`  |

### Rate Limiting

- Default: 1000 requests per 15 minutes per IP
- Configurable in `src/config/rateLimit.ts`

### Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: DDoS protection
- **Input Validation**: Zod schema validation
- **Error Handling**: Structured error responses

## 🧪 Testing

The project uses Jest for testing with TypeScript support:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Setup test database
npm run test:setup
```

Test files are located in:

- `tests/routes/` - API endpoint tests
- `tests/services/` - Business logic tests
- `tests/utils/` - Utility function tests

### Coverage Thresholds

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# From project root
docker-compose -f docker-compose.dev.yml up
```

## 📊 API Documentation

Interactive API documentation is available at `/api/docs` when running the server. The documentation includes:

- Complete endpoint reference
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error code definitions

### Health Check

```http
GET /health
```

Returns server status, environment, and version information.

### API Info

```http
GET /api
```

Returns API information and available endpoints.

## 🔒 Security

### Implemented Security Measures

- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Rate Limiting**: Request throttling per IP
- **Input Validation**: Zod schema validation on all inputs
- **Error Sanitization**: No sensitive data in error responses
- **File Upload Security**: Cloudinary integration for secure file handling

### Security Headers

- Content Security Policy (CSP)
- Cross-Origin Resource Policy
- Referrer Policy
- X-Frame-Options
- X-Content-Type-Options

## 📁 Project Structure

```text
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Configuration files
│   ├── cloudinary.ts      # Cloudinary setup
│   ├── db.ts              # Database connection
│   ├── rateLimit.ts       # Rate limiting config
│   └── swagger.ts         # API documentation config
├── controllers/           # Request handlers
├── middlewares/           # Custom middleware
├── routes/                # API route definitions
├── services/              # Business logic layer
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── templates/             # PDF templates

tests/                     # Test files
prisma/                    # Database schema and migrations
storage/                   # Local file storage
```

## 🤝 Contributing

1. **Setup development environment**

   ```bash
   npm install
   npm run prisma:migrate
   npm run dev
   ```

2. **Run tests before committing**

   ```bash
   npm run test:coverage
   npm run lint
   npm run type-check
   ```

3. **Follow code style**
   - ESLint configuration enforced
   - Prettier for code formatting
   - TypeScript for type safety

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Error

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npm run prisma:migrate`

#### PDF Generation Issues

- Ensure Cloudinary credentials are correct
- Check Chrome/Puppeteer installation
- Verify file storage permissions

#### CORS Errors

- Update `ALLOWED_ORIGINS` in `.env`
- Check frontend URL configuration

#### Port Already in Use

- Change `PORT` in `.env`
- Kill existing processes: `lsof -ti:8080 | xargs kill`

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=* npm run dev
```

For support, please check the API documentation at `/api/docs` or review the test files for usage examples.
