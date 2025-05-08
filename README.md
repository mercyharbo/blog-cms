# Personal Headless CMS

A modern, flexible headless CMS built with Node.js, Express, TypeScript, and Supabase. This CMS provides a powerful API for managing content types, content entries, media assets, and user authentication.

## Features

- **Dynamic Content Types**

  - Create custom content types with flexible fields
  - Support for various field types (text, rich text, images, arrays, references)
  - Field validation and configuration options

- **Content Management**

  - Create, read, update, and delete content entries
  - Dynamic fields based on content type definitions
  - Support for draft and published states
  - Rich text editor support
  - Category and tag management

- **Media Management**

  - Upload and manage media files
  - Support for images and PDFs
  - Automatic file type validation
  - File metadata storage
  - Secure file storage using Supabase Storage

- **Authentication & Authorization**

  - User authentication with Supabase Auth
  - JWT-based authentication
  - Role-based access control
  - Row Level Security (RLS) policies

- **API Features**
  - RESTful API design
  - TypeScript support for type safety
  - CORS configured for secure access
  - Error handling middleware
  - Request validation

## Prerequisites

- Node.js (v18.0.0 or higher)
- Supabase account and project
- npm or yarn package manager

## Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd personal-headless-cms
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with:

   ```
   PORT=5000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:

   - Run the SQL migrations in your Supabase SQL editor from the `migrations` folder
   - Enable Row Level Security (RLS) policies for your tables

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### Content Type Endpoints

```
POST /api/content/types           # Create content type
GET /api/content/types           # List all content types
GET /api/content/types/:id       # Get single content type
PUT /api/content/types/:id       # Update content type
DELETE /api/content/types/:id    # Delete content type
```

### Content Endpoints

```
POST /api/content/:typeId        # Create content
GET /api/content/:typeId         # List content by type
GET /api/content/:typeId/:id     # Get single content
PUT /api/content/:typeId/:id     # Update content
DELETE /api/content/:typeId/:id  # Delete content
```

### Media Endpoints

```
POST /api/media/upload          # Upload media file
GET /api/media                  # List all media
GET /api/media/:id             # Get single media
DELETE /api/media/:id          # Delete media
```

## Project Structure

```
src/
├── config/          # Configuration files
│   └── supabase.ts # Supabase client configuration
├── controllers/     # Route controllers
│   ├── auth.ts     # Authentication controllers
│   ├── content.ts  # Content management
│   └── media.ts    # Media management
├── middleware/      # Custom middleware
│   ├── auth.ts     # Authentication middleware
│   ├── upload.ts   # File upload middleware
│   └── error.ts    # Error handling
├── routes/         # API routes
│   ├── auth.ts     # Auth routes
│   ├── content.ts  # Content routes
│   └── media.ts    # Media routes
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

## Data Models

### Content Types

```typescript
interface ContentType {
  id?: string
  name: string
  title: string
  fields: ContentTypeField[]
}
```

### Content

```typescript
interface Content {
  id?: string
  type_id: string
  data: {
    [key: string]: any
  }
}
```

### Media

```typescript
interface Media {
  id?: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  userId: string
}
```

## Security

The CMS implements several security measures:

- JWT-based authentication
- Row Level Security (RLS) policies in Supabase
- CORS configuration
- File type validation
- Request validation
- Error handling

## Development

```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Run in production mode
npm start

# Watch TypeScript changes
npm run watch-ts
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the repository or contact the maintainers.
