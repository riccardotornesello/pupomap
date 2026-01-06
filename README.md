This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js 20 or higher
- A Google Cloud account with OAuth credentials
- (Optional) PostgreSQL database or use SQLite (default)

### Database Setup

The application uses **Drizzle ORM** with a migration system that supports both PostgreSQL and SQLite databases.

#### Using SQLite (Default)
If no `DATABASE_URL` is configured, the application will automatically use SQLite with the database file stored at `data/pupi.db`.

#### Using PostgreSQL
1. Set up a PostgreSQL database
2. Configure the `DATABASE_URL` in your `.env.local`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/pupomap
   ```

#### Database Migrations

The database schema is managed through migrations using Drizzle Kit:

- **Development**: Migrations run automatically when you start the dev server
- **Production**: Migrations run automatically after build via the `postbuild` script

**Migration Commands:**
```bash
# Generate a new migration after schema changes
pnpm db:generate

# Run migrations manually
pnpm db:migrate

# Open Drizzle Studio to view/edit database
pnpm db:studio
```

#### Seeding Data

The database no longer seeds data automatically. Instead, you can load data in two ways:

1. **Via Admin Panel**: 
   - Go to the admin backoffice at `/admin`
   - Click the "Importa JSON" button
   - Upload a JSON file with pupi data (see `seed-data.json` for format example)

2. **Via API**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/seed \
     -H "Content-Type: application/json" \
     -H "x-admin-password: your-admin-password" \
     -d '{"pupi": [...]}'
   ```

**JSON Format Example:**
```json
[
  {
    "id": "1",
    "name": "Pupo Name",
    "description": "Description",
    "lat": 40.0565,
    "lng": 17.978,
    "imageUrl": "https://example.com/image.jpg",
    "artist": "Artist Name",
    "theme": "Theme"
  }
]
```

### Setup Google OAuth

Before running the application, you need to set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project
4. Create OAuth 2.0 credentials (OAuth client ID)
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
6. Fill in your credentials in `.env.local`:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
   - `NEXTAUTH_SECRET`: Generate a random secret using: `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Keep as `http://localhost:3000` for local development
   - `ADMIN_PASSWORD`: Set a secure password for admin backoffice access
   - `DATABASE_URL`: (Optional) Configure database connection. If not set, SQLite will be used by default

### Installation

Install dependencies:

```bash
pnpm install
```

### Running the Development Server

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Authentication Features

The application now uses real Google OAuth authentication:

- Click "Accedi con Google" to sign in with your Google account
- The system retrieves your first name, last name, and unique identifier
- Your authentication session persists across page refreshes
- Users must be authenticated to vote on Pupi

### Admin Backoffice

The application includes an admin backoffice system for managing pupi:

- Access the admin login at [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Use the password configured in the `ADMIN_PASSWORD` environment variable
- From the admin dashboard you can:
  - Create new pupi
  - Edit existing pupi
  - Delete pupi
  - View all pupi in a table format
  - **Choose pupo location by clicking on an interactive map**
  - **Upload images directly to Google Cloud Storage** (optional)
- All changes are persisted to the configured database (SQLite or PostgreSQL)

#### Image Upload Setup (Optional)

To enable image uploads to Google Cloud Storage:

1. Create a Google Cloud Storage bucket
2. Create a service account with Storage Object Admin permissions
3. Download the service account key JSON file
4. Configure the following environment variables in `.env.local`:
   ```
   GCS_PROJECT_ID=your-project-id
   GCS_BUCKET_NAME=your-bucket-name
   GCS_CREDENTIALS='{"type":"service_account",...}'
   ```
5. Make your bucket public or configure appropriate access controls

If GCS is not configured, you can still provide image URLs manually.

**Security Note:** The current implementation uses a simple password-based authentication suitable for single-admin use cases. For production deployments:
- Always use HTTPS to encrypt credentials in transit
- Consider implementing proper session management with JWT tokens
- Regularly rotate the admin password
- Consider adding rate limiting to prevent brute-force attacks

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
