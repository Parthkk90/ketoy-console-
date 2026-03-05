# Troubleshooting Guide - React Three Fiber Installation

## The Error
```
[plugin:vite:import-analysis] Failed to resolve import "@react-three/fiber" from "src/components/Antigravity.jsx". Does the file exist?
```

This error occurs because the required dependencies are not installed in `node_modules`.

## Solution

### Option 1: Run the Installation Script (Recommended)

**Windows (PowerShell):**
```powershell
cd F:\W3\console-ketoy\console-ui
.\install.ps1
```

**Windows (Command Prompt):**
```cmd
cd F:\W3\console-ketoy\console-ui
install.bat
```

### Option 2: Manual Installation

1. **Open a terminal** in the `console-ui` directory:
   ```bash
   cd F:\W3\console-ketoy\console-ui
   ```

2. **Remove old installations** (optional but recommended):
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install all dependencies including:
   - `three@^0.161.0`
   - `@react-three/fiber@^8.15.16`

### Option 3: Install Only Missing Packages

If you just want to add the missing packages:

```bash
npm install three @react-three/fiber --save
```

### Option 4: Use Alternative Package Managers

**Using Yarn:**
```bash
yarn add three @react-three/fiber
```

**Using pnpm:**
```bash
pnpm add three @react-three/fiber
```

**Using Bun:**
```bash
bun add three @react-three/fiber
```

## Verify Installation

After installation, verify the packages are installed:

```bash
npm list three @react-three/fiber
```

You should see:
```
console-ui@1.0.0
├── @react-three/fiber@8.15.16
└── three@0.161.0
```

## Check node_modules

Verify the folders exist:
```bash
ls node_modules/three
ls node_modules/@react-three/fiber
```

## Start the Development Server

Once dependencies are installed:

```bash
npm run dev
```

The app should now start without errors on `http://localhost:5173`

## Common Issues

### Issue 1: Permission Denied
**Solution:** Run as Administrator or use `sudo` on Unix systems

### Issue 2: Network Issues
**Solution:** 
- Check your internet connection
- Try using a different npm registry:
  ```bash
  npm config set registry https://registry.npmjs.org/
  ```

### Issue 3: Node Version
**Solution:** Ensure you have Node.js v16 or higher:
```bash
node --version
```

### Issue 4: Corrupted Cache
**Solution:**
```bash
npm cache clean --force
npm install
```

### Issue 5: Lock File Issues
**Solution:**
```bash
rm package-lock.json
rm -rf node_modules
npm install
```

## Still Not Working?

1. **Check package.json** - Verify these dependencies are listed:
   ```json
   "dependencies": {
     "@react-three/fiber": "^8.15.16",
     "three": "^0.161.0"
   }
   ```

2. **Restart VS Code** - Sometimes the editor needs a restart to pick up new dependencies

3. **Clear Vite Cache**:
   ```bash
   rm -rf node_modules/.vite
   ```

4. **Try a fresh install**:
   ```bash
   cd ..
   rm -rf console-ui/node_modules
   cd console-ui
   npm install
   ```

## Need More Help?

If you continue to experience issues:

1. Check the [Three.js documentation](https://threejs.org/docs/)
2. Check the [React Three Fiber documentation](https://docs.pmnd.rs/react-three-fiber)
3. Verify your Node.js and npm versions are up to date
4. Check for any firewall or antivirus blocking npm

## Manual Package Installation

If automated installation fails, you can manually:

1. Download the packages from npm registry
2. Extract to `node_modules/` directory
3. Run `npm install` to link them

But this is rarely necessary and not recommended.
