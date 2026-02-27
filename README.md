# S3 Email Dashboard

A full-stack Next.js dashboard to manage emails stored in AWS S3 (from SES as raw MIME `.eml` files).

## Features

- **Check**: List and view emails with cursor-based pagination
- **Search**: Search emails by subject, sender, recipient, or body content
- **Delete**: Delete emails with confirmation dialog
- **Download Attachments**: Download email attachments directly from the detail view

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, SCSS)
- **S3 SDK**: `@aws-sdk/client-s3` v3
- **MIME Parsing**: `mailparser` (simpleParser)
- **Validation**: Zod
- **HTML Sanitization**: DOMPurify + jsdom (server-side)
- **State Management**: React Context + useReducer + Hooks
- **Testing**: Jest + Testing Library + aws-sdk-client-mock

## Architecture

```
src/
  app/              # Next.js App Router pages + API routes
  components/       # Feature components (emailList, emailDetail, etc.)
  ui/               # Reusable UI primitives (Button, Modal, Spinner, etc.)
  context/          # React Context + Reducer for email state
  hooks/            # Custom React hooks
  lib/              # Server-side only (S3 client, email parser, logger)
  services/         # Client-side fetch wrappers
  styles/           # SCSS variables, mixins, reset
  types/            # TypeScript interfaces and types
  utils/            # Utility functions (date formatting, sanitization)
__tests__/
  unit/             # Unit tests for lib, hooks, utils
  integration/      # API route integration tests
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/emails` | List emails with pagination |
| POST | `/api/emails` | Search emails |
| GET | `/api/emails/[id]` | Get email detail |
| DELETE | `/api/emails/[id]` | Delete email |
| GET | `/api/emails/[id]/attachments/[index]` | Download attachment |
| GET | `/api/health` | Health check |

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file and fill in AWS credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Configure `.env.local` with your AWS settings:
   ```
   AWS_REGION=ap-southeast-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   S3_BUCKET_NAME=your-ses-email-bucket
   S3_PREFIX=emails/
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run format` | Format code with Prettier |

## Workflow Diagram

```
User Request -> Next.js API Route -> Zod Validation -> S3 Operations -> Email Parser -> Response
                                          |                  |               |
                                     AppError            Logger          DOMPurify
                                          |                  |               |
                                     ErrorHandler      Structured      Sanitized HTML
                                                        JSON Logs
```

## Key Design Decisions

1. **Cursor-based pagination**: Uses S3 ContinuationToken (base64-encoded) for efficient pagination
2. **Partial fetch for list**: Uses S3 Range header to fetch only first 8KB per email (enough for headers)
3. **Server-side sanitization**: HTML email bodies sanitized with DOMPurify before sending to client
4. **Sandboxed rendering**: Email HTML rendered in sandboxed iframe for additional security
5. **Parallel parsing**: List endpoint parses emails with Promise.allSettled (concurrency limit 10)
