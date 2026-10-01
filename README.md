```markdown
# 🏃 Performa

> **Competitive fitness tracking with ghost racing, ranked seasons & leaderboards — built for the RevenueCat Shipathon**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000.svg?logo=expo)](https://expo.dev)
[![Powered by RevenueCat](https://img.shields.io/badge/Payments-RevenueCat-E03A3E.svg)](https://www.revenuecat.com)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg?logo=supabase)](https://supabase.com)

---

## 📱 What is Performa?

Performa is a competitive fitness tracking app for runners, cyclists, and walkers. It turns every workout into a competition — race your own ghost, climb ranked seasonal leaderboards, and unlock cosmetic rewards as you progress.

### Core Features

| Feature | Description |
|---|---|
| 🗺️ **GPS Activity Tracking** | Real-time route recording with Google Maps integration |
| 👻 **Ghost Racing** | Race against your past self or other athletes |
| 🏆 **Ranked Seasons** | ELO-based competitive seasons with leaderboards |
| ⚡ **XP & Progression** | Level up, earn XP, unlock cosmetic rewards |
| 🎨 **Cosmetics System** | Banners, themes, and profile customization |
| 🛣️ **Route Builder** | Create and save custom routes |
| 💳 **Performa Pro** | Monthly & yearly subscription powered by RevenueCat |

---

## 💰 RevenueCat Integration

This app was built for the **RevenueCat Shipathon** and integrates the `react-native-purchases` SDK end-to-end.

### How it's integrated

**`src/RevenueCatManager.js`** — Custom `useRevenueCat` hook:
```js
const { currentOffering, purchasePackage, isPro } = useRevenueCat();
```

- `currentOffering` — dynamically fetches available packages from the RevenueCat dashboard
- `purchasePackage` — triggers the native checkout sheet when a plan card is tapped
- `isPro` — boolean entitlement check for `create_an_app_called_performa_pro`

**`src/services/revenuecat.ts`** — Singleton `SubscriptionService` with sandbox simulation fallback

**`app/pro/index.tsx`** — Pro screen with Annual & Monthly plan cards wired to `purchasePackage()`

### Entitlement ID
```
create_an_app_called_performa_pro
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 52) |
| Navigation | Expo Router (file-based) |
| Maps | Google Maps SDK (`react-native-maps`) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Payments | RevenueCat (`react-native-purchases`) |
| State | Zustand |
| Language | TypeScript |
| Styling | React Native StyleSheet |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Android Studio / Xcode
- A RevenueCat account with configured offerings

### Installation

```bash
# Clone the repo
git clone https://github.com/vinay-krishna-1/performa_revenuecat.git
cd performa_revenuecat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your credentials in .env
```

### Environment Variables

Create a `.env` file from `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_your_revenuecat_key
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_your_revenuecat_key
```

### Run

```bash
# Start Expo dev server
npx expo start

# Build release APK for Android
cd android && ./gradlew installRelease
```

---

## 📁 Project Structure

```
performa_revenuecat/
├── app/                        # Expo Router screens
│   ├── (tabs)/                 # Main tab screens (home, record, me, leaderboard)
│   ├── pro/                    # Performa Pro paywall screen
│   └── _layout.tsx
├── src/
│   ├── RevenueCatManager.js    # useRevenueCat hook (RC SDK integration)
│   ├── components/             # Reusable UI components
│   ├── constants/              # Cosmetics, themes, config
│   ├── features/               # Domain logic (recording, progression, GPS)
│   ├── services/               # Supabase, RevenueCat, Sync services
│   └── types/                  # TypeScript types
├── assets/                     # Images, fonts, icons
├── supabase/                   # DB migrations
├── .env.example                # Environment variable template
└── LICENSE                     # MIT License
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Built with

- [RevenueCat](https://www.revenuecat.com) — In-app subscriptions & entitlements
- [Expo](https://expo.dev) — React Native framework
- [Supabase](https://supabase.com) — Backend as a service
- [Google Maps Platform](https://developers.google.com/maps) — Maps & GPS
  
```
