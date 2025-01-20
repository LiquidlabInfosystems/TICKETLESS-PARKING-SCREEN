const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const WEBSOCKET_PORT = 8000;
const os = require('os');
const { execSync } = require('child_process');

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Broadcast function to send messages to all connected clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Serve React build files
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Fallback route to serve React's index.html for any non-API requests
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    ws.on('message', (message) => {
        const textToSend = message.toString();
        broadcast(textToSend); // Send text to all WebSocket clients
        ws.send(message)
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Function to get the current IP address
function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            // Check for IPv4 and skip internal (localhost) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null; // No IP found
}

// Function to check if the device has a valid IP address
function checkForIP() {
    const ip = getIPAddress();
    return ip !== null; // Returns true if a valid IP address is found
}

// Function to start the server and browser
function startServer() {
    const ip = getIPAddress();
    if (!ip) {
        console.log('No IP address found. Retrying in 5 seconds...');
        setTimeout(waitForIPAndStart, 5000); // Retry every 5 seconds
        return;
    }

    server.listen(WEBSOCKET_PORT, "0.0.0.0", () => {
        console.log(`WEBSOCKET is running on http://${ip}:${WEBSOCKET_PORT}`);

        // Automatically open the browser
        exec(`chromium-browser --kiosk --disable-infobars --noerrdialogs  http://${ip}:${WEBSOCKET_PORT}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error opening browser: ${stderr}`);
            } else {
                console.log("Browser opened");
            }
        });
    });
}

// Retry logic: keep trying until the IP address is found
function waitForIPAndStart() {
    if (checkForIP()) {
        console.log("IP address found. Starting server...");
        startServer();
    } else {
        console.log("No IP address found. Retrying in 5 seconds...");
        setTimeout(waitForIPAndStart, 5000); // Retry every 5 seconds
    }
}

// Start the process
waitForIPAndStart();
