# Hybridized - Next.js 16

Modern web application built with Next.js 16, Supabase, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Framework:** Next.js 16 (Canary)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Animations:** Framer Motion
- **i18n:** next-intl
- **Deployment:** Vercel

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Add your Supabase credentials to `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── home/            # Home page
│   ├── about/           # About page
│   ├── tests/           # Tests page
│   ├── contact/         # Contact page
│   ├── donation/        # Donation page
│   └── auth/            # Authentication pages
├── components/          # Reusable components
├── lib/                 # Utilities and configurations
│   ├── supabase/       # Supabase client setup
│   └── types/          # TypeScript types
└── public/             # Static assets
```

## Database Schema

### Tables

**hybridized**
- id (int, primary key)
- created_at (timestamp)
- name (text)
- description (text)
- formula (text)
- id_new (int)
- iframe_url (text)
- cover_url (text)

**profiles**
- id (uuid, primary key)
- created_at (timestamp)
- email (text)
- full_name (text)
- avatar_url (text)

## Deployment

This project is optimized for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Features

- ✅ Server-side rendering with Next.js 16
- ✅ Supabase authentication
- ✅ Database integration
- ✅ Responsive design with Tailwind
- ✅ Type-safe with TypeScript
- ✅ Ready for Edge Functions
- ✅ Optimized for Vercel deployment

## License

MIT
