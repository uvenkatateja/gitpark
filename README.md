# 🚗 Repo Ridez

A shared district for GitHub Repos. See your repositories as low-poly collectible cars in a shared 3D district.

## 🌟 Features

- **3D District**: Explore a shared world where every GitHub user has their own space.
- **Car Representations**: Each repository is represented as a unique car based on its size, language, and popularity.
- **Social Interaction**: Give kudos, visit other sections, and see live activity.
- **Realtime Presence**: See how many citizens are viewing the district right now.
- **Leaderboard**: Compete for the top spot in the "City Hall" based on your total GitHub stars.

## 🛠️ Technology Stack

- **Frontend**: Vite, React, Three.js (@react-three/fiber, @react-three/drei), Tailwind CSS.
- **Backend**: Supabase (Database, Auth, Realtime).
- **Icons**: Lucide React.
- **Deployment**: Vercel / GitHub Pages.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd repo-ridez
   ```

2. **Install dependencies**
   ```sh
   npm i
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

### Database Setup

Run the SQL in `supabase/schema.sql` within your Supabase SQL Editor to set up the necessary tables, RLS policies, and functions.

## 📜 District Rules

- **Authenticated Parking**: Only users who sign in with GitHub are parked in the district.
- **Permanent Spots**: Once you park, your spot remains in the district.
- **Kudos**: You can give kudos to other citizens once per day.

---

Built with ❤️ for the GitHub community.
