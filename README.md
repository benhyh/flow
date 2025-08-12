# Flow - Visual Workflow Automation

A serverless visual workflow automation tool built with Next.js, Supabase, and React Flow.

## Features

- Visual drag-and-drop workflow editor
- Email-to-task automation (Gmail → Trello/Asana)
- AI-powered content analysis and suggestions
- Real-time workflow monitoring
- Serverless architecture with Vercel and Supabase

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Vercel Edge Functions, Supabase
- **Database**: Supabase (PostgreSQL)
- **Caching**: Upstash Redis
- **Authentication**: Supabase Auth with OAuth
- **Workflow Engine**: React Flow
- **AI**: OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Upstash Redis account
- Vercel account (for deployment)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Set up your environment variables in `.env.local`:
   - Supabase project URL and keys
   - Upstash Redis URL and token
   - OAuth credentials for Gmail, Trello, Asana
   - OpenAI API key

4. Set up the database schema in Supabase:
   - Run the SQL in `supabase/schema.sql` in your Supabase SQL editor

5. Start the development server:

```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run Jest tests
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client
│   ├── redis.ts        # Redis client
│   └── types.ts        # TypeScript types
└── providers/          # React providers
    └── query-provider.tsx
```

## Deployment

This project is configured for deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
