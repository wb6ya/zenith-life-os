# 🌌 ZENITH - Gamified Life Operating System

<div align="center">
  <img src="./public/icon.png" width="150" alt="Project Banner" />
</div>

> **"Turn your life into a game. Build habits, track fitness, and ship projects."**

**Zenith** is a comprehensive, personal **Life Operating System** built with the latest web technologies. It replaces scattered productivity apps with a single, cohesive "Mission Control" center. Designed with a **Cyberpunk/Dark aesthetic**, it combines fitness tracking, project management, and knowledge archiving into a cohesive RPG-style experience.

---

## 📖 User Guide

### 1. 🌅 Daily Workflow (The Core Loop)
Zenith is designed to be your daily driver. Here is the recommended workflow:

1.  **Morning Briefing**: 
    - Open the dashboard to see your **Daily Quests**.
    - Check your **Sleep & Hygiene** tasks (e.g., "Drink Water", "No Sugar").
    - Review your **Streaks** status.
2.  **Ignite the Engine (Fitness)**:
    - Go to the **Fitness Hub**.
    - Select your active **Workout Plan**.
    - Start the **Live Player** and log your sets.
    - *Reward*: XP & Health Stat boost on completion.
3.  **Deep Work (Mission Control)**:
    - Navigate to **Projects**.
    - Select your "Focus Project".
    - Complete project-specific tasks (e.g., "Code Login Feature").
    - *Reward*: XP & Career Stat boost.
4.  **Evening Review**:
    - Check off any remaining daily habits.
    - Review your **XP gained**.
    - Plan for tomorrow.

### 2. 🏋️ Fitness Hub
Your personal digital coach.
- **Creating Plans**: Go to 'Fitness' -> 'Create Plan'. Add days (Push, Pull, Legs) and exercises.
- **Live Mode**: Click 'Start Workout' on the dashboard to enter the immersive player.
- **Progress Tracking**: The system tracks volume/intensity automatically.

### 3. 🚀 Mission Control (Projects)
Manage your empire.
- **Projects**: Create projects with a GitHub link and description.
- **Focus Mode**: Mark one project as "Focus" to get daily tasks generated for it.
- **Shipping**: When done, click "Ship It" to archive the project and get a massive XP reward.

### 4. 📚 Knowledge Base (Second Brain)
- **Library**: Add books you are reading. Track pages read daily.
- **Academy**: Track online courses. Upload certificates upon completion.
- **Media Deck**: Track games, movies, and anime.

---

## 🎮 Gamification System

Zenith uses a sophisticated RPG engine to keep you motivated.

| Mechanic | Description | Reward |
| :--- | :--- | :--- |
| **XP (Experience)** | Earned by completing *any* action (Task, Workout, Reading). | Level Up |
| **Leveling** | As you gain XP, you level up. | New Badge / Title |
| **Streaks** | Consecutive days of completing all daily tasks. | **Ignited Mode** (Visual Effects) |
| **Stats** | Your actions boost specific stats: **Health, Intelligence, Charisma**. | Character Growth |

---

## ✨ Key Features

### 🎮 Gamification Engine
- **XP & Leveling System:** Earn XP for every completed task, workout, or reading session.
- **Soulslike Streaks:** A dynamic streak system with visual states ("Ignited" 🔥 / "Faded" 💀).
- **Badges & Achievements:** Unlock visual badges for consistency and milestones.
- **Celebrations:** Immersive visual and sound effects upon leveling up or completing milestones.

### 🌍 Localization & UI
- **Bilingual Support:** Full support for **Arabic (RTL)** and **English (LTR)** with instant switching.
- **High-Performance UI:** Built with **Tailwind CSS** and **Framer Motion** for smooth animations.
- **Responsive Design:** Fully optimized for Desktop and Mobile usage.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/) (Mongoose ODM) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Auth** | [NextAuth.js](https://next-auth.js.org/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Sound** | [use-sound](https://github.com/joshwcomeau/use-sound) |

---

## 🚀 Getting Started

Follow these steps to run the project locally:

### 1. Clone the repository
```bash
git clone https://github.com/wb6ya/zenith-life-os.git
cd zenith-os
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_string_here

# Optional: Google Auth (If implemented)
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

> **Note**: If you encounter validation errors like `Task validation failed`, please restart your development server to apply the latest schema changes.