#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting database migrations...');

// Change to backend directory
process.chdir(path.join(__dirname));

// Run prisma migrate deploy (for production) or prisma migrate dev (for development)
const command = process.argv[2] === 'prod' ? 'migrate deploy' : 'migrate dev';

console.log(`Executing: npx prisma ${command}`);

const prisma = spawn('npx', ['prisma', ...command.split(' ')], {
  stdio: 'inherit',
  shell: true
});

prisma.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Database migrations completed successfully!');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    const generate = spawn('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      shell: true
    });
    
    generate.on('close', (generateCode) => {
      if (generateCode === 0) {
        console.log('✅ Prisma client generated successfully!');
        console.log('🎉 Database setup complete!');
      } else {
        console.error('❌ Failed to generate Prisma client');
        process.exit(1);
      }
    });
  } else {
    console.error(`❌ Migration failed with code ${code}`);
    process.exit(1);
  }
});