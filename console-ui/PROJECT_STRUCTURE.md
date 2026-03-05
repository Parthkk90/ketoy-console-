# Project Structure Overview

This document provides a complete overview of the console-ui frontend application.

## 📂 Directory Structure

```
console-ui/
│
├── public/                         # Static assets
│   └── vite.svg                   # Favicon/logo
│
├── src/                           # Source code
│   │
│   ├── components/                # Reusable React components
│   │   ├── Layout.jsx            # Main app layout with header
│   │   ├── CreateAppModal.jsx    # Modal for creating new apps
│   │   ├── CreateScreenModal.jsx # Modal for creating new screens
│   │   └── MobilePreview.jsx     # Mobile device preview component
│   │
│   ├── pages/                    # Page-level components (routes)
│   │   ├── AuthPage.jsx          # Authentication/registration page
│   │   ├── ProjectsPage.jsx      # List all projects
│   │   ├── ProjectDetailPage.jsx # Single project detail with screens
│   │   └── ScreenEditorPage.jsx  # JSON editor with live preview
│   │
│   ├── services/                 # API service layer
│   │   └── api.js               # Axios instance & API methods
│   │
│   ├── store/                    # Zustand state management
│   │   ├── authStore.js         # Authentication state
│   │   ├── appStore.js          # Apps/projects state
│   │   └── screenStore.js       # Screens state
│   │
│   ├── App.jsx                   # Main app component with routing
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles + Tailwind
│
├── index.html                     # HTML entry point
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── eslintrc.cjs                  # ESLint configuration
├── package.json                  # Dependencies and scripts
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
│
├── README.md                     # Full documentation
├── QUICK_START.md               # Quick start guide
├── FEATURES.md                  # Complete feature list
└── PROJECT_STRUCTURE.md         # This file
```

## 🔄 Data Flow

```
User Action
    ↓
React Component
    ↓
Zustand Store (optional)
    ↓
API Service (services/api.js)
    ↓
Axios → Backend API (localhost:3000)
    ↓
Response
    ↓
Update Zustand Store
    ↓
Re-render Component
```

## 🗺️ Route Structure

```
/                               → Redirect to /projects (if authenticated)
/auth                          → AuthPage (if not authenticated)
/projects                      → ProjectsPage (list all projects)
/projects/:packageName         → ProjectDetailPage (project details + screens)
/projects/:packageName/screens/:screenName → ScreenEditorPage (JSON editor)
```

## 🏗️ Component Architecture

### Pages

#### 1. AuthPage
- **Purpose**: Developer registration and authentication
- **Features**: 
  - Registration form
  - Google OAuth placeholder
  - API key generation
  - Auto-redirect after login

#### 2. ProjectsPage
- **Purpose**: Display all projects/apps
- **Features**:
  - Projects table/grid
  - Create new project button
  - Navigation to project details
  - Loading and empty states

#### 3. ProjectDetailPage
- **Purpose**: Show single project with all screens
- **Features**:
  - Project metadata
  - Screens grid
  - Add screen button
  - Delete app functionality
  - Breadcrumb navigation

#### 4. ScreenEditorPage
- **Purpose**: Edit screen JSON with live preview
- **Features**:
  - Monaco editor (JSON)
  - Mobile device preview
  - Save/revert/format buttons
  - Real-time validation
  - Unsaved changes indicator

### Components

#### Layout
- Header with logo
- User info display
- Logout button
- Outlet for child routes

#### CreateAppModal
- Form for new app creation
- Platform selection
- API key display
- Copy to clipboard

#### CreateScreenModal
- Form for new screen creation
- JSON content editor
- Default template

#### MobilePreview
- Renders JSON as UI components
- iPhone-style frame
- Supports multiple component types

## 🔌 API Integration

### API Service (`services/api.js`)

```javascript
// Axios instance with interceptors
api.interceptors.request.use() // Inject API key
api.interceptors.response.use() // Handle 401 errors

// Developer APIs
developerAPI.register()
developerAPI.getProfile()
developerAPI.updateProfile()

// App APIs
appAPI.register()
appAPI.getAll()
appAPI.getDetails()
appAPI.update()
appAPI.delete()

// Screen APIs
screenAPI.upload()
screenAPI.getAll()
screenAPI.getDetails()
screenAPI.update()
screenAPI.delete()
```

## 🎯 State Management

### Zustand Stores

#### authStore
```javascript
{
  developer: { id, email, name, ... },
  developerApiKey: "string",
  setAuth(),
  updateDeveloper(),
  logout()
}
```

#### appStore
```javascript
{
  apps: [...],
  currentApp: { ... },
  loading: boolean,
  error: string,
  setApps(),
  setCurrentApp(),
  addApp(),
  updateApp(),
  removeApp()
}
```

#### screenStore
```javascript
{
  screens: [...],
  currentScreen: { ... },
  jsonContent: "string",
  loading: boolean,
  error: string,
  setScreens(),
  setCurrentScreen(),
  setJsonContent(),
  addScreen(),
  updateScreen(),
  removeScreen()
}
```

## 🎨 Styling Architecture

### Tailwind CSS Classes

**Colors:**
- Background: `bg-[#0a1525]`, `bg-[#1a2332]`, `bg-[#0f1c2e]`
- Text: `text-white`, `text-gray-400`, `text-gray-300`
- Accent: `text-green-400`, `bg-green-500`

**Common Patterns:**
- Cards: `bg-[#1a2332] rounded-lg border border-gray-800`
- Buttons: `px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg`
- Inputs: `bg-[#0f1c2e] border border-gray-700 rounded-lg`

### Custom Styles (`index.css`)
- Global resets
- Custom scrollbar styles
- Font families

## 🔧 Build Configuration

### Vite (`vite.config.js`)
- React plugin
- Dev server on port 5173
- API proxy to localhost:3000
- Fast HMR

### Tailwind (`tailwind.config.js`)
- Content paths for purging
- Extended color palette
- Custom theme values

### PostCSS (`postcss.config.js`)
- Tailwind CSS plugin
- Autoprefixer

## 📦 Dependencies

### Production Dependencies
```json
{
  "@monaco-editor/react": "^4.6.0",  // Code editor
  "axios": "^1.6.7",                  // HTTP client
  "react": "^18.2.0",                 // UI library
  "react-dom": "^18.2.0",             // React DOM
  "react-router-dom": "^6.22.0",      // Routing
  "zustand": "^4.5.0"                 // State management
}
```

### Dev Dependencies
```json
{
  "@vitejs/plugin-react": "^4.2.1",   // Vite React plugin
  "tailwindcss": "^3.4.1",            // CSS framework
  "vite": "^5.1.0",                   // Build tool
  "eslint": "^8.56.0"                 // Linter
}
```

## 🚀 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔐 Authentication Flow

```
1. User visits /auth
2. Fills registration form
3. Submits → POST /api/developers/register
4. Receives { developer, apiKey }
5. Store in localStorage
6. Set Zustand auth state
7. Redirect to /projects
8. All subsequent API calls include x-developer-api-key header
```

## 📝 JSON Schema Support

The `MobilePreview` component supports rendering:

```javascript
{
  scaffold: "Main app structure",
  center: "Center alignment",
  column: "Vertical layout",
  row: "Horizontal layout",
  text: "Text display",
  container: "Container with padding",
  image: "Image display",
  button: "Button element"
}
```

## 🔄 Component Lifecycle

### Typical Page Lifecycle

```
1. Component mounts
2. useEffect runs
3. Fetch data from API
4. Update Zustand store
5. Component re-renders with data
6. User interacts
7. State updates
8. Re-render
9. Component unmounts (cleanup)
```

## 🎯 Best Practices Implemented

✅ Separation of concerns (components, services, stores)  
✅ Reusable components  
✅ Centralized API calls  
✅ Error handling  
✅ Loading states  
✅ Form validation  
✅ Responsive design  
✅ Accessibility basics  
✅ Clean code structure  
✅ Consistent naming conventions  

## 📚 Learning Resources

To understand this codebase better:

1. **React**: https://react.dev
2. **React Router**: https://reactrouter.com
3. **Vite**: https://vitejs.dev
4. **Tailwind CSS**: https://tailwindcss.com
5. **Zustand**: https://github.com/pmndrs/zustand
6. **Monaco Editor**: https://microsoft.github.io/monaco-editor
7. **Axios**: https://axios-http.com

---

**Last Updated**: March 2, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✨
