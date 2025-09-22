# Organic Certification Frontend

A modern, responsive Next.js frontend application for managing organic farm certification processes. This React application provides an intuitive interface for farmers, inspectors, and administrators to manage certifications, inspections, farms, and generate compliance certificates.

## 🌱 Features

### Core Functionality

- **Farmer Management**: Register and manage farmer profiles with comprehensive contact information
- **Farm & Field Tracking**: Organize farms by location, track individual fields and crop information
- **Inspection Workflows**: Complete inspection processes with interactive checklists and compliance scoring
- **Certificate Generation**: View and manage generated compliance certificates with PDF download capabilities
- **Responsive Design**: Fully responsive interface that works seamlessly across desktop, tablet, and mobile devices
- **Dark/Light Theme**: Built-in theme switching with system preference detection

### User Experience

- **Intuitive Navigation**: Clean sidebar navigation with active state indicators
- **Form Validation**: Real-time form validation with user-friendly error messages
- **Interactive Tables**: Sortable, filterable data tables with search functionality
- **Modal Dialogs**: Confirmation dialogs and form modals for streamlined workflows
- **Loading States**: Smooth loading indicators and skeleton screens
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

## 🚀 Tech Stack

### Core Technologies

- **Next.js 15.5.3** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type safety and enhanced developer experience
- **Tailwind CSS 4** - Utility-first CSS framework

### UI Components & Libraries

- **Shadcn/ui** - High-quality, accessible component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful, customizable icons
- **React Icons** - Popular icon library
- **Magic UI** - Enhanced UI components with animations

### Form Management & Validation

- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - Schema validation with TypeScript integration
- **@hookform/resolvers** - Form validation resolvers

### Development & Testing

- **Jest** - Testing framework with coverage reporting
- **Testing Library** - Simple and complete testing utilities
- **ESLint** - Code linting with Next.js configuration
- **Prettier** - Code formatting with Tailwind CSS plugin

## 🏗️ Project Structure

```text
frontend/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles and Tailwind imports
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Homepage
│   ├── not-found.tsx            # 404 page
│   └── (root)/                  # Route group with sidebar layout
│       ├── layout.tsx           # Layout with sidebar navigation
│       ├── farmer/              # Farmer management pages
│       ├── farm/                # Farm management pages
│       ├── inspection/          # Inspection workflow pages
│       └── certificate/         # Certificate management pages
├── components/                   # Reusable React components
│   ├── ui/                      # Shadcn/ui base components
│   ├── magicui/                 # Magic UI components
│   ├── farmers/                 # Farmer-specific components
│   ├── farm/                    # Farm-specific components
│   ├── field/                   # Field management components
│   ├── inspections/             # Inspection components
│   ├── certificate/             # Certificate components
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── theme-provider.tsx       # Theme context provider
│   └── not-found-content.tsx    # 404 page content
├── lib/                         # Utility libraries
│   ├── utils.ts                 # Common utility functions
│   └── validations/             # Zod validation schemas
├── types/                       # TypeScript type definitions
│   ├── farmer.d.ts              # Farmer type definitions
│   ├── farm.d.ts                # Farm type definitions
│   ├── field.d.ts               # Field type definitions
│   ├── inspection.d.ts          # Inspection type definitions
│   └── certificate.d.ts         # Certificate type definitions
└── __tests__/                   # Test files
    ├── certificate-generation.test.ts
    └── compliance-score.test.ts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ with npm or yarn
- Running backend API (see backend README.md)

### Installation

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

4. **Start development server**

   ````bash
   npm run dev
   ```4. **Start development server**
   ```bash
   npm run dev
   ````

The application will be available at `http://localhost:3000`.

## 📜 Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production-ready application
- `npm start` - Start production server (requires build)

### Code Quality

- `npm run lint` - Run ESLint with caching
- `npm run format` - Format code with Prettier
- `npm run check` - Check code formatting
- `npm run lint-fix` - Auto-fix ESLint issues
- `npm run fix` - Format and fix all code issues
- `npm run type-check` - TypeScript type checking

### Testing

- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:ci` - Run tests for CI/CD pipeline
- `npm run test:debug` - Debug test issues

### Utilities

- `npm run clean` - Remove build artifacts and cache
- `npm run clean-install` - Fresh installation (removes node_modules)

## 🎨 UI Components

### Shadcn/ui Integration

The application uses [Shadcn/ui](https://ui.shadcn.com/) components with the following configuration:

- **Style**: New York
- **Base Color**: Neutral
- **CSS Variables**: Enabled for theming
- **Icon Library**: Lucide React
- **RSC**: React Server Components support

### Component Categories

#### Form Components

- Input fields with validation states
- Select dropdowns with search
- Textarea components
- Form labels and error messages
- Submit buttons with loading states

#### Data Display

- Responsive data tables
- Avatar components
- Badge and status indicators
- Tabs for content organization
- Tooltip for additional information

#### Navigation

- Alert dialogs for confirmations
- Modal dialogs for forms
- Sidebar navigation
- Theme toggle component

#### Feedback

- Toast notifications (Sonner)
- Loading spinners and skeletons
- Error boundaries
- Success/error states

## 🌐 API Integration

### Configuration

The frontend communicates with the backend API using the base URL configured in environment variables:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
```

### API Endpoints Used

- **Farmers**: `/farmers` - CRUD operations for farmer management
- **Farms**: `/farms` - Farm management and relationship handling
- **Fields**: `/fields` - Field tracking within farms
- **Inspections**: `/inspections` - Inspection workflow management
- **Certificates**: `/certificates` - Certificate generation and retrieval

### Data Validation

All API requests and responses are validated using Zod schemas located in `lib/validations/`:

```typescript
// Example farmer validation schema
export const farmerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format'),
  email: z.string().email('Invalid email format'),
  county: z.string().min(1, 'County is required'),
});
```

## 🎯 Key Features

### Farmer Management

- **Registration Form**: Comprehensive farmer registration with validation
- **Profile Management**: Edit and update farmer information
- **Farm Association**: Link multiple farms to farmers
- **Contact Tracking**: Phone and email management with uniqueness validation

### Farm & Field Operations

- **Farm Creation**: Add new farms with location and area details
- **Field Management**: Track individual fields within farms
- **Crop Information**: Manage crop types and growing seasons
- **Multi-tab Interface**: Organized tabs for fields, inspections, and certificates

### Inspection Workflows

- **Interactive Checklists**: Dynamic inspection forms with scoring
- **Compliance Calculation**: Real-time compliance score updates
- **Status Tracking**: Draft, submitted, approved, rejected states
- **Inspector Assignment**: Assign and track inspector information

### Certificate Management

- **Automated Generation**: Generate certificates based on inspection results
- **PDF Downloads**: Download compliance certificates as PDFs
- **Status Monitoring**: Track certificate validity and expiration
- **Bulk Operations**: Manage multiple certificates efficiently

## 🔒 Security & Best Practices

### Security Features

- **Input Sanitization**: All form inputs validated and sanitized
- **Type Safety**: Full TypeScript implementation prevents runtime errors
- **CORS Handling**: Proper cross-origin request management
- **Environment Variables**: Secure configuration management

### Performance Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Built-in Next.js image optimization
- **Server-Side Rendering**: Improved SEO and initial load times
- **Caching**: Browser and Next.js caching strategies

### Accessibility

- **WCAG Compliance**: Adherence to web accessibility guidelines
- **Keyboard Navigation**: Full keyboard navigation support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order and focus states
- **Color Contrast**: High contrast ratios for readability

## 🧪 Testing

### Test Structure

```text
__tests__/
├── certificate-generation.test.ts  # Certificate logic tests
└── compliance-score.test.ts        # Compliance calculation tests
```

### Testing Strategy

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction testing
- **Coverage Reporting**: Minimum 70% coverage requirement
- **CI/CD Integration**: Automated testing in deployment pipeline

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Debug failing tests
npm run test:debug
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

The application includes Docker configuration for containerized deployment:

```dockerfile
# Multi-stage build for optimized production image
FROM node:20-alpine AS builder
# ... build configuration

FROM node:20-alpine AS runner
# ... runtime configuration
```

### Environment Variables

Production environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NODE_ENV=production
```

## 🎨 Theming & Customization

### Theme Configuration

The application supports light and dark themes using `next-themes`:

```typescript
// Theme provider setup
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### Custom Styling

- **Tailwind CSS**: Utility-first approach with custom configuration
- **CSS Variables**: Theme-aware color system
- **Component Variants**: Class Variance Authority for component styling
- **Animation**: Custom animations with Tailwind CSS

### Color Scheme

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... more theme variables */
}

[data-theme='dark'] {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark theme variables */
}
```

## 🤝 Contributing

### Development Workflow

1. **Setup Development Environment**

   ```bash
   npm install
   npm run dev
   ```

2. **Code Quality Checks**

   ```bash
   npm run type-check
   npm run lint
   npm run test
   ```

3. **Before Committing**

   ```bash
   npm run fix        # Format and fix issues
   npm run test:ci    # Run full test suite
   ```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Extended Next.js and Prettier configurations
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

## 🐛 Troubleshooting

### Common Issues

#### API Connection Errors

- Verify backend is running on correct port
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure CORS is properly configured in backend

#### Build Failures

- Clear Next.js cache: `npm run clean`
- Reinstall dependencies: `npm run clean-install`
- Check TypeScript errors: `npm run type-check`

#### Styling Issues

- Verify Tailwind CSS compilation
- Check for CSS class conflicts
- Ensure theme provider is properly configured

#### Performance Issues

- Use Next.js built-in performance profiler
- Check for unnecessary re-renders
- Optimize images and static assets

### Debug Mode

Enable debug mode for development:

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Component-specific debugging
NODE_ENV=development npm run dev
```

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section above
2. Review test files for usage examples
3. Inspect component implementations for API patterns
4. Ensure backend API is running and accessible

---

Built with ❤️ using Next.js, React, and TypeScript
