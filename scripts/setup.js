const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env.local');
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

console.log('\n  ╔══════════════════════════════════╗');
console.log('  ║       AXCIS AI — Setup            ║');
console.log('  ╚══════════════════════════════════╝\n');

// Create data directories
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('  ✓ Created data/ directory');
}
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  console.log('  ✓ Created data/projects/ directory');
}

// Check .env.local
if (!fs.existsSync(ENV_PATH)) {
  const template = `ANTHROPIC_API_KEY=your-anthropic-api-key-here
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password-here
`;
  fs.writeFileSync(ENV_PATH, template);
  console.log('  ✓ Created .env.local template\n');
  console.log('  ⚠ IMPORTANT: You need to edit .env.local with your real credentials:\n');
  console.log('  1. ANTHROPIC_API_KEY:');
  console.log('     → Get it from https://console.anthropic.com/settings/keys\n');
  console.log('  2. GMAIL_USER:');
  console.log('     → Your Gmail email address\n');
  console.log('  3. GMAIL_APP_PASSWORD:');
  console.log('     → Go to https://myaccount.google.com/apppasswords');
  console.log('     → Create an app password for "Mail"');
  console.log('     → Copy the 16-character password\n');
} else {
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const issues = [];
  if (content.includes('your-anthropic-api-key-here')) {
    issues.push('ANTHROPIC_API_KEY is not set');
  }
  if (content.includes('your-email@gmail.com')) {
    issues.push('GMAIL_USER is not set');
  }
  if (content.includes('your-gmail-app-password-here')) {
    issues.push('GMAIL_APP_PASSWORD is not set');
  }
  if (issues.length > 0) {
    console.log('  ⚠ .env.local found but needs configuration:\n');
    issues.forEach(i => console.log(`    - ${i}`));
    console.log('\n  Edit .env.local to add your real credentials.');
  } else {
    console.log('  ✓ .env.local is configured');
  }
}

console.log('\n  To start the app:');
console.log('    npm run dev\n');
console.log('  Then open http://localhost:3000 in your browser.\n');
