# Quick Installation Instructions

## 🚨 IMPORTANT: Install Required Dependencies

The application requires Three.js and React Three Fiber for the animated background.

### Steps to Install:

1. **Open a NEW PowerShell or Command Prompt window**
2. **Navigate to the console-ui directory:**
   ```bash
   cd F:\W3\console-ketoy\console-ui
   ```

3. **Run ONE of these commands:**

   **Option A - Install all dependencies (Recommended):**
   ```bash
   npm install
   ```

   **Option B - Install only missing packages:**
   ```bash
   npm install three @react-three/fiber
   ```

   **Option C - Use Yarn:**
   ```bash
   yarn install
   ```

   **Option D - Use pnpm:**
   ```bash
   pnpm install
   ```

4. **Wait for installation to complete** (may take 1-2 minutes)

5. **Verify installation:**
   ```bash
   npm list three @react-three/fiber
   ```

   You should see:
   ```
   console-ui@1.0.0
   ├── @react-three/fiber@8.15.16
   └── three@0.161.0
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser** to http://localhost:5173

## ✅ What's Been Updated

- ✅ `package.json` - Added three@^0.161.0 and @react-three/fiber@^8.15.16
- ✅ `Antigravity.jsx` - 3D particle animation component created
- ✅ `AuthPage.jsx` - Integrated animated background
- ✅ All backgrounds changed to pure black (#000000)

## 🔍 Verify Installation

Check if the packages exist:
```bash
dir node_modules\three
dir node_modules\@react-three\fiber
```

Or on PowerShell:
```powershell
Test-Path node_modules/three
Test-Path node_modules/@react-three
```

## 🐛 Still Getting Errors?

If you still see the import error after installation:

1. **Stop the dev server** (Ctrl+C)
2. **Delete node_modules:**
   ```bash
   rmdir /s /q node_modules
   ```
3. **Delete package-lock.json:**
   ```bash
   del package-lock.json
   ```
4. **Fresh install:**
   ```bash
   npm install
   ```
5. **Start dev server:**
   ```bash
   npm run dev
   ```

## 📞 Need Help?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed help
- Verify Node.js version: `node --version` (should be v16+)
- Verify npm version: `npm --version`
