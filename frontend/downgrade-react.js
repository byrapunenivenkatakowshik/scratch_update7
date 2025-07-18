// Script to downgrade React to version 18 for compatibility
const fs = require('fs');
const path = require('path');

console.log('🔧 React 19 → React 18 Downgrade Script');
console.log('====================================');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✅ Found package.json');
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Current versions
console.log('\n📊 Current versions:');
console.log('React:', packageJson.dependencies.react);
console.log('React DOM:', packageJson.dependencies['react-dom']);

// Update to React 18
const newVersions = {
  react: '^18.2.0',
  'react-dom': '^18.2.0'
};

const newDevVersions = {
  '@types/react': '^18.2.0',
  '@types/react-dom': '^18.2.0'
};

// Update dependencies
packageJson.dependencies = {
  ...packageJson.dependencies,
  ...newVersions
};

// Update devDependencies
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  ...newDevVersions
};

// Write updated package.json
try {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('\n✅ Updated package.json');
} catch (error) {
  console.error('❌ Error writing package.json:', error.message);
  process.exit(1);
}

console.log('\n🎯 New versions:');
console.log('React:', newVersions.react);
console.log('React DOM:', newVersions['react-dom']);

console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm start');
console.log('3. Test document opening');

console.log('\n🔄 To rollback if needed:');
console.log('1. Run: npm install react@19.1.0 react-dom@19.1.0');
console.log('2. Run: npm start');

console.log('\n✅ Package.json updated successfully!');