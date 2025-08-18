# SportsBuddy Mobile-Ready Architecture Guide

## 🎯 Architecture Principles for Web + Mobile

### 1. Business Logic Separation ✅ (Already Good)

```
src/
├── api/           # All Supabase queries (reusable)
├── hooks/         # Custom React hooks (reusable logic)
├── lib/           # Utilities & config (fully reusable)
├── services/      # 🔄 ADD: Business logic services
└── types/         # 🔄 ADD: TypeScript types (if migrating)
```

### 2. Recommended Additions

#### A. Services Layer (Business Logic)

```javascript
// src/services/activityService.js
export class ActivityService {
  static async joinActivity(activityId, userId) {
    // Business logic + API calls
  }

  static async leaveActivity(activityId, userId) {
    // Business logic + API calls
  }

  static validateActivityData(data) {
    // Validation logic
  }
}
```

#### B. State Management (Consider Zustand/Jotai)

```javascript
// src/stores/activityStore.js
// Lightweight state that works on mobile too
```

#### C. Constants & Configuration

```javascript
// src/constants/app.js
export const APP_CONFIG = {
  MAX_PARTICIPANTS: 20,
  ACTIVITY_TYPES: ["running", "cycling", "tennis"],
  // etc.
};
```

### 3. PWA Setup Checklist

#### Required Files:

- [ ] `public/manifest.json`
- [ ] `public/sw.js` (Service Worker)
- [ ] Icons (16x16 to 512x512)
- [ ] `vite-plugin-pwa` setup

#### Vite PWA Configuration:

```javascript
// vite.config.js
import { VitePWA } from "vite-plugin-pwa";

export default {
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "SportsBuddy",
        short_name: "SportsBuddy",
        description: "Find sports partners near you",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
};
```

### 4. Mobile-Friendly Component Patterns

#### Responsive Design (Already doing well!)

```javascript
// Current approach is good:
className = "hover:bg-gray-50 p-2 rounded-lg transition-colors";
// Works on mobile with touch
```

#### Touch-Friendly Interactions

- ✅ Current dropdowns work well on mobile
- ✅ Click areas are appropriately sized
- ✅ Hover states gracefully degrade

### 5. Data Layer Best Practices (Already Following!)

#### API Layer ✅

```javascript
// src/api/activities.js - Already well structured
export async function fetchFeed({ daysAhead = 14, currentUserId } = {}) {
  // Pure data fetching - works on any platform
}
```

#### Custom Hooks ✅

```javascript
// src/hooks/useSupabaseAuth.js - Already abstracted
// Can be reused in React Native
```

### 6. Future Mobile Considerations

#### React Native Reusability:

- ✅ **API functions**: Direct reuse
- ✅ **Business logic**: Direct reuse
- ✅ **Validation functions**: Direct reuse
- 🔄 **Components**: Need React Native versions
- 🔄 **Styling**: Need React Native styles

#### Shared Package Strategy:

```
packages/
├── shared/           # Shared business logic
│   ├── api/         # Supabase calls
│   ├── services/    # Business logic
│   ├── utils/       # Utilities
│   └── types/       # TypeScript types
├── web/             # Web-specific UI
└── mobile/          # React Native UI
```

## 🚀 Next Steps Priority

1. **Immediate** (Current Sprint):

   - [ ] Add PWA configuration
   - [ ] Create service worker
   - [ ] Add app manifest
   - [ ] Test installability

2. **Short Term** (Next Sprint):

   - [ ] Extract business logic to services
   - [ ] Add input validation functions
   - [ ] Create shared constants file
   - [ ] Consider state management library

3. **Medium Term** (Future):
   - [ ] TypeScript migration
   - [ ] Monorepo setup for mobile
   - [ ] Shared package architecture

## 📱 PWA Benefits

- **Desktop**: Installable app experience
- **Android**: App-like experience without Play Store
- **iOS**: Add to homescreen (limited but useful)
- **Offline**: Cache static resources
- **Performance**: Faster subsequent loads
