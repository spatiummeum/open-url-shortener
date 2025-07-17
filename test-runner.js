const { spawn } = require('child_process');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');

console.log('Running frontend tests...');
console.log('Working directory:', frontendPath);

const testProcess = spawn('npm', ['test'], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
});

testProcess.on('error', (error) => {
  console.error('Error running tests:', error);
});