const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const requiredFiles = [
    'firebase-service-account.json',
    'build/icon.png',
    'package.json',
    'electron/main.ts'
];

console.log('🔍 Release Validation Started...\n');

let hasError = false;

// 1. Check for critical files
console.log('Checking critical files...');
requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
        console.error(`❌ MISSING FILE: ${file}`);
        hasError = true;
    } else {
        console.log(`✅ Found: ${file}`);
    }
});

// 2. Check if critical files are gitignored
console.log('\nChecking gitignore status...');
try {
    const ignored = execSync('git check-ignore firebase-service-account.json').toString().trim();
    if (ignored) {
        console.error('❌ CRITICAL ERROR: firebase-service-account.json is gitignored! It will not be pushed to GitHub.');
        hasError = true;
    } else {
        console.log('✅ firebase-service-account.json is tracked by git.');
    }
} catch (error) {
    // git check-ignore returns exit code 1 if file is NOT ignored (which is good)
    console.log('✅ firebase-service-account.json is tracked by git.');
}

// 3. Check Version
const packageJson = require('../package.json');
console.log(`\nCurrent Version: ${packageJson.version}`);
console.log('⚠️  Make sure you have bumped the version number if this is a new release.\n');

if (hasError) {
    console.error('🛑 VALIDATION FAILED. Fix the errors above before releasing.');
    process.exit(1);
} else {
    console.log('✨ Validation Passed! You are ready to push.');
    process.exit(0);
}
