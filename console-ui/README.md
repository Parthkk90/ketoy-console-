# Console UI - Server-Driven UI Frontend

A modern React-based frontend console for managing Server-Driven UI applications, screens, and JSON definitions. Built with React, Vite, TailwindCSS, and Monaco Editor.

## 🌟 Features

- **Interactive Welcome Page**: 3D animated particle background with mouse interaction
- **Developer Authentication**: Register and manage developer accounts
- **Project Management**: Create and manage multiple mobile applications
- **Screen Editor**: Visual JSON editor with live mobile preview
- **Monaco Editor**: Professional code editing experience
- **Real-time Preview**: See your UI changes instantly in a mobile frame
- **Version Control**: Track and manage screen versions
- **Responsive Design**: Beautiful dark-themed UI with pure black background

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000`

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd console-ui
npm install
```

**Note:** If you encounter issues with Three.js dependencies, manually install them:

```bash
npm install three @react-three/fiber
```

Or use your preferred package manager:
```bash
# yarn
yarn add three @react-three/fiber

# pnpm
pnpm add three @react-three/fiber

# bun
bun add three @react-three/fiber
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📁 Project Structure

```
console-ui/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── CreateAppModal.jsx
│   │   ├── CreateScreenModal.jsx
│   │   └── MobilePreview.jsx
│   ├── pages/             # Page components
│   │   ├── AuthPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── ProjectDetailPage.jsx
│   │   └── ScreenEditorPage.jsx
│   ├── services/          # API service layer
│   │   └── api.js
│   ├── store/             # Zustand state management
│   │   ├── authStore.js
│   │   ├── appStore.js
│   │   └── screenStore.js
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Usage Guide

### 1. Register as Developer

- Navigate to the authentication page
- Click "Register as Developer"
- Fill in your details (email, name, contact info)
- Save the API key provided

### 2. Create a Project

- Click "+ Create New" on the Projects page
- Enter package name (e.g., com.example.app)
- Enter app name and optional description
- Select platform (Android/iOS/Both)
- Save the app API key for mobile integration

### 3. Create Screens

- Click on a project to view details
- Click "+ Add Screen"
- Enter screen name (e.g., home_screen)
- Add display name and description
- Provide initial JSON content
- Click "Create"

### 4. Edit Screens

- Click "Edit Screen" on any screen card
- Use the Monaco editor to modify JSON
- See live preview on the right side
- Click "Save" to persist changes
- Use format button to pretty-print JSON
- Use revert button to discard changes

## 🎨 Design Features

- **Dark Theme**: Modern dark UI with teal/green accents
- **Mobile Preview**: Realistic iPhone-style frame for previews
- **JSON Editor**: Monaco editor with syntax highlighting
- **Responsive Layout**: Works on desktop and tablet screens
- **Loading States**: Smooth loading animations
- **Error Handling**: Clear error messages and validation

## 🔌 API Integration

The frontend connects to the backend API at `/api` (proxied through Vite):

- `/api/developers/*` - Developer management
- `/api/apps/*` - Application management
- `/api/screens/*` - Screen management

Configure the backend URL in `vite.config.js` if needed:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

## 🛠️ Technologies Used

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **Three.js**: 3D graphics library for animated backgrounds
- **React Three Fiber**: React renderer for Three.js
- **Monaco Editor**: VS Code's editor for JSON editing
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management
- **Axios**: HTTP client

## 📝 JSON Schema Example

The screen editor supports various component types:

```json
{
  "type": "scaffold",
  "body": {
    "type": "center",
    "child": {
      "type": "text",
      "data": "Hello World"
    }
  }
}
```

Supported component types:
- `scaffold` - Main app structure
- `center` - Center alignment
- `column` - Vertical layout
- `row` - Horizontal layout
- `text` - Text display
- `container` - Container with padding
- `image` - Image display
- `button` - Button element

## 🔒 Authentication

- Developer API keys are stored in localStorage
- API key is sent with every request via `x-developer-api-key` header
- Automatic redirect to auth page on 401 errors

## 🐛 Troubleshooting

### API Connection Issues

- Ensure backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Verify API key is being sent in requests

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Monaco Editor Not Loading

- Ensure `@monaco-editor/react` is installed
- Check browser console for module loading errors

## 📄 License

This project is part of the Server-Driven UI system.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues or questions, please open an issue on the repository or contact the development team.
