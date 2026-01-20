# Plate Mate

Meal planning app that helps busy people eat fresh and healthy food while minimizing waste, saving time grocery shopping, and avoiding decision fatigue.

<img width="2922" height="1584" alt="CleanShot 2026-01-20 at 14 01 39@2x" src="https://github.com/user-attachments/assets/69bb8625-35be-4886-80e2-249cb82efd27" />
<img width="2928" height="1584" alt="CleanShot 2026-01-20 at 14 04 00@2x" src="https://github.com/user-attachments/assets/54dd058f-59a0-431a-9184-5ab07e048424" />
<img width="2896" height="1582" alt="CleanShot 2026-01-20 at 14 02 51@2x" src="https://github.com/user-attachments/assets/a444da2a-8be9-4a9e-9d4d-f6b768aaa3ae" />


## Features

### Recipe Discovery & Selection
- **Browse Recipes** - Explore curated recipes from trusted sources like Love & Lemons and NYT Cooking
- **Dietary Filtering** - Filter recipes by dietary preferences (vegetarian, vegan, gluten-free, keto, and more)
- **Like & Save** - Save your favorite recipes to build a personalized recipe collection

### Meal Planning
- **AI-Powered Suggestions** - Get intelligent recipe recommendations based on your preferences and ingredient overlap
- **Hybrid Planning** - Choose some meals yourself, then let AI fill in the rest

### Smart Grocery Lists
- **Auto-Generated Lists** - Grocery lists are automatically created from your selected recipes
- **Ingredient Deduplication** - AI combines and consolidates duplicate ingredients across recipes
- **Category Organization** - Items grouped by store section (Produce, Dairy, Pantry, etc.)
- **Weekly Staples** - Define items that automatically appear on every grocery list
- **Perishable Alerts** - Items marked "Use soon" for better meal timing
- **Progress Tracking** - Check off items as you shop (persisted to local storage)

### User Profiles & Preferences
- **Dietary Preferences** - Set restrictions like vegetarian, no red meat, halal, kosher, etc.
- **Weekly Staples** - Add recurring items (milk, eggs, bread) to every grocery list
- **Personalized Experience** - Recipes are filtered based on your preferences

### Authentication
- **Email/Password Auth** - Secure login and signup via Supabase
- **Guest Browsing** - Browse recipes before creating an account
- **Seamless Onboarding** - Save liked recipes before login, they sync after signup

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and Turbopack
- **React 19** - UI library with server and client components
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, and real-time subscriptions
- **Next.js API Routes** - Server-side API endpoints

### AI/ML
- **Anthropic Claude API** - Powers recipe suggestions, grocery list generation, and ingredient analysis

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- Anthropic API key

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Running Tests

```bash
npm test
```

