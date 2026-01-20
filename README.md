# Plate Mate

A smart meal planning application that helps busy people eat fresh and healthy food while minimizing waste, saving time grocery shopping, and avoiding decision fatigue.

## Features

### Recipe Discovery & Selection
- **Browse Recipes** - Explore curated recipes from trusted sources like Love & Lemons and NYT Cooking
- **Dietary Filtering** - Filter recipes by dietary preferences (vegetarian, vegan, gluten-free, keto, and more)
- **Like & Save** - Save your favorite recipes to build a personalized recipe collection
- **Select All** - Quickly select or deselect all recipes when browsing

### Meal Planning
- **Choose Your Own** - Manually select specific recipes you want to cook this week
- **AI-Powered Suggestions** - Get intelligent recipe recommendations based on your preferences and ingredient overlap
- **Hybrid Planning** - Choose some meals yourself, then let AI fill in the rest
- **Weekly Plans** - Organize meals by week with easy modification

### Smart Grocery Lists
- **Auto-Generated Lists** - Grocery lists are automatically created from your selected recipes
- **Ingredient Deduplication** - AI combines and consolidates duplicate ingredients across recipes
- **Category Organization** - Items grouped by store section (Produce, Dairy, Pantry, etc.)
- **Weekly Staples** - Define items that automatically appear on every grocery list
- **Perishable Alerts** - Items marked "Use soon" for better meal timing
- **Progress Tracking** - Check off items as you shop (persisted to local storage)
- **Copy to Clipboard** - Export your list for use in other apps
- **Storage Tips** - AI-generated tips for ingredient storage

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

### Other
- **date-fns** - Date manipulation
- **Cheerio** - HTML parsing for recipe scraping
- **Jest** - Testing framework

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
npm run test:watch
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── _components/        # Shared React components
│   ├── [username]/         # User-specific pages
│   ├── api/                # API routes
│   ├── login/              # Authentication
│   ├── profile/            # User preferences
│   ├── quiz/               # Recipe selection onboarding
│   └── recipes/            # Recipe browsing
├── services/
│   └── supabase/           # Database client and API functions
└── utilities/
    ├── hooks/              # Custom React hooks
    └── prompts/            # AI prompt templates
```

## Database Schema

Key tables:
- `recipes` - Recipe data (name, URL, image, ingredients, dietary tags)
- `user_profiles` - User preferences and weekly staples
- `user_liked_recipes` - User's saved recipes
- `weekly_user_recipes` - Weekly meal plan assignments
