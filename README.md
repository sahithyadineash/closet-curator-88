# VWardrobe - Digital Wardrobe Manager

## Project info

VWardrobe is a modern digital wardrobe management application that helps you organize your clothing collection, track usage, and get AI-powered outfit suggestions.

## Features

- **Digital Wardrobe**: Upload and categorize your clothing items
- **Usage Tracking**: Monitor how often you wear items
- **Wash Management**: Automatically track items that need washing
- **Smart Matching**: AI-powered outfit suggestions
- **Secure Storage**: Your data is protected with row-level security

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Supabase project URL and anon key:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## How can I edit this code?

Clone this repository and set up your development environment:

**Requirements**: Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Step 1: Clone the repository
git clone <repository_url>

# Step 2: Navigate to the project directory.
cd vwardrobe

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Step 5: Start the development server
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS
- Supabase (Database & Authentication)

## Database Setup

1. Create a new Supabase project
2. Run the migration file: `supabase/migrations/20250128000000_create_vwardrobe_schema.sql`
3. Enable Row Level Security (RLS) on all tables
4. Set up storage buckets for images

## Security Features

- Row Level Security (RLS) ensures users can only access their own data
- Secure authentication with Supabase Auth
- Protected API endpoints
- Secure file storage with proper access controls

## Deployment

The application can be deployed to any static hosting service like Vercel, Netlify, or similar platforms. Make sure to set the environment variables in your deployment platform.
