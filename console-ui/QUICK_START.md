# Quick Start Guide - Console UI

## Prerequisites
- Node.js v16+ installed
- Backend API running on http://localhost:3000

## Step 1: Install Dependencies

Open terminal in the console-ui directory and run:

```bash
npm install
```

This will install:
- React and React Router
- Vite (build tool)
- TailwindCSS (styling)
- Monaco Editor (code editor)
- Axios (API calls)
- Zustand (state management)

## Step 2: Start Development Server

```bash
npm run dev
```

The app will start on: **http://localhost:5173**

## Step 3: First Time Setup

1. **Open your browser** to http://localhost:5173
2. **Register as Developer**:
   - Click on the registration form
   - Enter your email and name
   - Fill optional contact details
   - Click "Register"
   - **IMPORTANT**: Copy and save the API key shown

3. **Create Your First Project**:
   - Click "+ Create New"
   - Enter package name: `com.example.myapp`
   - Enter app name: `My First App`
   - Add description (optional)
   - Select platform
   - Click "Create"
   - **IMPORTANT**: Copy and save the App API key

4. **Create Your First Screen**:
   - Click on your newly created project
   - Click "+ Add Screen"
   - Enter screen name: `home_screen`
   - Enter display name: `Home Screen`
   - Modify the default JSON or use as-is
   - Click "Create"

5. **Edit Your Screen**:
   - Click "Edit Screen" on the screen card
   - Edit JSON in the left panel
   - See live preview on the right
   - Click "Save" when done

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Troubleshooting

### Backend Connection Failed
- Make sure the backend server is running on port 3000
- Check the terminal for any errors
- Verify the proxy configuration in vite.config.js

### Monaco Editor Not Loading
- Clear browser cache
- Delete node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Port 5173 Already in Use
- Change the port in vite.config.js:
  ```javascript
  server: {
    port: 5174  // or any other available port
  }
  ```

## Default JSON Structure

The default screen JSON structure is:

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

You can modify this to create different layouts!

## Tips

- Use the **Format** button to prettify your JSON
- Use the **Revert** button to discard unsaved changes
- The preview updates as you type in the editor
- All changes are autosaved to localStorage for the auth state
- Keep your API keys safe - they cannot be retrieved again

## Next Steps

1. Explore different component types in the JSON
2. Create multiple screens for your app
3. Integrate the mobile SDK with your app's API key
4. Test your screens in the mobile app

For more details, see the full README.md file.
