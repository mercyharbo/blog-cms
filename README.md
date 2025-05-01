# Personal Headless CMS

A free, self-hosted headless CMS built with Node.js, Express, and Supabase.

## Features

- Content type management
- Rich text editor
- Media management
- User authentication and authorization
- RESTful API
- TypeScript support
- Supabase database and storage

## Prerequisites

- Node.js (v14 or higher)
- Supabase account
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── routes/         # API routes
├── middleware/     # Custom middleware
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## API Documentation

The API documentation will be available at `/api-docs` when the server is running.

## License

MIT
