// Main entry point - redirect to server
const { exec } = require('child_process');

console.log('🚀 Starting Orchid Republic Server...');
console.log('📍 Redirecting to server.js for main application');

// Start the main server
exec('node server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error starting server: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️ Server stderr: ${stderr}`);
    return;
  }
  console.log(`✅ Server output: ${stdout}`);
});