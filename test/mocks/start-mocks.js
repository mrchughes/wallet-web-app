const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'Solid OIDC', file: 'mock-solid-oidc.js', port: 3004 },
    { name: 'PDS', file: 'mock-pds.js', port: 3003 },
    { name: 'DID:ION', file: 'mock-did-ion.js', port: 3002 }
];

const processes = [];

function startService(service) {
    const filePath = path.join(__dirname, service.file);
    const child = spawn('node', [filePath], {
        stdio: 'inherit',
        cwd: __dirname
    });

    child.on('error', (err) => {
        console.error(`Failed to start ${service.name} service:`, err);
    });

    child.on('close', (code) => {
        console.log(`${service.name} service exited with code ${code}`);
    });

    processes.push({ name: service.name, process: child });
    console.log(`Started ${service.name} service on port ${service.port}`);
}

function stopAllServices() {
    console.log('Stopping all mock services...');
    processes.forEach(({ name, process }) => {
        console.log(`Stopping ${name}...`);
        process.kill('SIGTERM');
    });
    process.exit(0);
}

// Handle shutdown gracefully
process.on('SIGINT', stopAllServices);
process.on('SIGTERM', stopAllServices);

// Start all services
console.log('Starting mock services...');
services.forEach(startService);

console.log('\\nAll mock services started!');
console.log('\\nService URLs:');
services.forEach(service => {
    console.log(`- ${service.name}: http://localhost:${service.port}`);
});

console.log('\\nPress Ctrl+C to stop all services');

// Keep the main process alive
setInterval(() => {
    // Check if all processes are still running
    const running = processes.filter(({ process }) => !process.killed);
    if (running.length !== processes.length) {
        console.log('Some services have stopped. Restarting...');
        // Could implement auto-restart logic here
    }
}, 5000);
