# Moovle Onboarding Flow Documentation

## Overview

The onboarding flow is a simple one-step process that collects the user's location to personalize their Moovle experience.

## Flow Architecture

### 1. User Registration

- Users sign up via `/signup` page
- After successful registration, they are automatically redirected to `/onboarding`
- OAuth users (Google/Facebook) are also redirected to onboarding

### 2. Onboarding Step

#### Location Collection

- Single step that collects user's location (city, state, country)
- Used for finding nearby activities and sports buddies
- Uses LocationInput component for consistent formatting
- Option to skip for now and set location later

## Technical Implementation

### Protected Routes

```jsx
// Onboarding page - requires auth but not completed onboarding
<ProtectedRoute requireOnboarding={false}>
  <OnboardingPage />
</ProtectedRoute>

// Main app - requires auth AND completed onboarding
<ProtectedRoute requireOnboarding={true}>
  <AppLayout />
</ProtectedRoute>
```

### Database Schema

```sql
-- profiles table includes:
onboarding_completed BOOLEAN DEFAULT FALSE
location TEXT
```

### Navigation Logic

1. **New User**: Signup → Onboarding → App
2. **Returning User (incomplete)**: Login → Onboarding → App
3. **Returning User (complete)**: Login → App
4. **Already Complete**: /onboarding → redirect to /app

## Component Files

- `OnboardingPage.jsx` - Main onboarding wizard
- `ProtectedRoute.jsx` - Route protection with onboarding logic
- `SignupPage.jsx` - Redirects to onboarding after signup
- `App.jsx` - Route definitions with protection levels

## Migration Required

Run the SQL migration to add the onboarding_completed column:

```sql
-- See: supabase-migrations/add-onboarding-completed.sql
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
```

## Testing Flow

1. **New User Test**:

   - Sign up at `/signup`
   - Should redirect to `/onboarding`
   - Complete all 5 steps
   - Should redirect to `/app`

2. **Incomplete User Test**:

   - Create user without completing onboarding
   - Try to access `/app` directly
   - Should redirect to `/onboarding`

3. **Complete User Test**:
   - User with onboarding_completed = true
   - Try to access `/onboarding`
   - Should redirect to `/app`
