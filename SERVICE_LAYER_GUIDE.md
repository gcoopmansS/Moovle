# Service Layer Architecture Guide

## 🎯 **Service Layer Pattern for SportsBuddy**

Yes, exactly! You'll create a service for each major domain in your app. Here's the recommended structure:

## 📁 **Service Layer Structure**

```
src/services/
├── index.js              # Central exports
├── activityService.js    # ✅ Already created
├── friendshipService.js  # ✅ Already created
├── profileService.js     # ✅ Already created
├── authService.js        # 🔄 Next to create
├── notificationService.js # 🔄 Future
├── searchService.js      # 🔄 Future
└── locationService.js    # 🔄 Future
```

## 🔧 **Service Layer Benefits**

### **1. Business Logic Separation**

```javascript
// ❌ Before: Business logic in components
function ActivityCard({ activity }) {
  const handleJoin = async () => {
    if (!user) {
      alert("You must be logged in");
      return;
    }
    if (activity.participants.length >= activity.max_participants) {
      alert("Activity is full");
      return;
    }
    await joinActivity(activity.id, user.id);
  };
}

// ✅ After: Business logic in services
function ActivityCard({ activity }) {
  const handleJoin = async () => {
    try {
      await ActivityService.joinActivity(activity.id, user.id);
      // Success handled by service
    } catch (error) {
      // Error handled by service
      toast.error(error.message);
    }
  };
}
```

### **2. Consistent Error Handling**

```javascript
// All services return consistent format:
{
  success: true/false,
  message: "User-friendly message",
  data: result
}
```

### **3. Validation & Sanitization**

```javascript
// Input validation happens in services
ActivityService.validateActivity(data);
ProfileService.sanitizeInput(userInput);
```

### **4. Mobile Reusability**

```javascript
// React Native can import same services:
import { ActivityService } from "@sportsbuddy/shared/services";

// Works identically on mobile!
await ActivityService.joinActivity(activityId, userId);
```

## 🚀 **Recommended Next Services**

### **AuthService** (High Priority)

```javascript
// src/services/authService.js
export class AuthService {
  static async signIn(email, password) {}
  static async signUp(userData) {}
  static async signOut() {}
  static async resetPassword(email) {}
  static async updatePassword(newPassword) {}
  static async refreshSession() {}
  static validateAuthState() {}
}
```

### **NotificationService** (Medium Priority)

```javascript
// src/services/notificationService.js
export class NotificationService {
  static async sendActivityReminder(activityId) {}
  static async sendFriendRequest(fromUser, toUser) {}
  static async markAsRead(notificationId) {}
  static async getUnreadCount(userId) {}
  static async subscribeToActivity(activityId) {}
}
```

### **SearchService** (Medium Priority)

```javascript
// src/services/searchService.js
export class SearchService {
  static async searchActivities(query, filters) {}
  static async searchUsers(query) {}
  static async getRecentSearches(userId) {}
  static async saveSearch(userId, query) {}
  static async getPopularActivities() {}
}
```

### **LocationService** (Future)

```javascript
// src/services/locationService.js
export class LocationService {
  static async getCurrentLocation() {}
  static async searchNearbyActivities(lat, lng, radius) {}
  static async geocodeAddress(address) {}
  static async getDistanceBetween(point1, point2) {}
}
```

## 💡 **Usage Patterns**

### **In Components**

```javascript
// Clean component code
import { ActivityService, FriendshipService } from "../services";

function MyComponent() {
  const handleJoinActivity = async (activityId) => {
    try {
      const result = await ActivityService.joinActivity(activityId, user.id);
      toast.success(result.message);
      refreshActivities();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await FriendshipService.sendFriendRequest(user.id, userId);
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error(error.message);
    }
  };
}
```

### **In Custom Hooks**

```javascript
// src/hooks/useActivities.js
import { ActivityService } from "../services";

export function useActivities() {
  const [activities, setActivities] = useState([]);

  const joinActivity = useCallback(
    async (activityId) => {
      await ActivityService.joinActivity(activityId, user.id);
      // Refresh activities
    },
    [user.id]
  );

  return { activities, joinActivity };
}
```

## 🎯 **Migration Strategy**

### **Phase 1: Core Services** (Current)

- ✅ ActivityService
- ✅ FriendshipService
- ✅ ProfileService

### **Phase 2: Auth & Validation** (Next Sprint)

- [ ] AuthService
- [ ] Enhanced validation
- [ ] Error handling standardization

### **Phase 3: Advanced Features** (Future)

- [ ] NotificationService
- [ ] SearchService
- [ ] LocationService

### **Phase 4: Optimization** (Future)

- [ ] Caching layer
- [ ] Offline support
- [ ] Background sync

## 🔄 **Component Migration Example**

```javascript
// Before: Mixed concerns
function ActivityCard({ activity }) {
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not logged in");
      if (activity.participants.length >= activity.max_participants) {
        throw new Error("Activity is full");
      }
      await joinActivity(activity.id, user.id);
      toast.success("Joined successfully!");
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };
}

// After: Clean separation
function ActivityCard({ activity }) {
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const result = await ActivityService.joinActivity(activity.id, user.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };
}
```

This service layer approach makes your code:

- 🎯 **Mobile-ready**: Services work on any platform
- 🧪 **Testable**: Easy to unit test business logic
- 🔄 **Maintainable**: Changes in one place
- 📱 **Scalable**: Ready for React Native
- 🛡️ **Robust**: Consistent error handling
