#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking dependencies...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('❌ node_modules directory not found');
  console.log('📦 Installing all dependencies...\n');
  execSync('npm install', { stdio: 'inherit' });
} else {
  // Check for specific packages
  const threePath = path.join('node_modules', 'three');
  const fiberPath = path.join('node_modules', '@react-three', 'fiber');
  
  const hasThree = fs.existsSync(threePath);
  const hasFiber = fs.existsSync(fiberPath);
  
  if (!hasThree || !hasFiber) {
    console.log('❌ Missing required packages:');
    if (!hasThree) console.log('   - three');
    if (!hasFiber) console.log('   - @react-three/fiber');
    console.log('\n📦 Installing missing packages...\n');
    execSync('npm install three @react-three/fiber', { stdio: 'inherit' });
  } else {
    console.log('✅ All required packages are installed');
    console.log('✅ three');
    console.log('✅ @react-three/fiber\n');
  }
}

// Verify installation
console.log('\n🔍 Verifying installation...\n');
try {
  execSync('npm list three @react-three/fiber', { stdio: 'inherit' });
  console.log('\n✅ Installation verified successfully!');
  console.log('\n🚀 You can now run: npm run dev');
} catch (error) {
  console.log('\n⚠️  Verification had some warnings, but packages should be installed');
  console.log('🚀 Try running: npm run dev');
}
