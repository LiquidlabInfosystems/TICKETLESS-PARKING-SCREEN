const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 8000;
const WEBSOCKET_PORT = 9090;
const os = require('os');

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
    return '127.0.0.1'; // Fallback to localhost if no IP is found
}
// app.listen(PORT, "0.0.0.0", () => {
//     const ip = getIPAddress();
//     console.log(`app is running on http://${ip}:${PORT}`);

// })
server.listen(WEBSOCKET_PORT, "0.0.0.0", () => {
    const ip = getIPAddress();
    console.log(`WEBSOCKET is running on http://${ip}:${WEBSOCKET_PORT}`);

    // Automatically open the browser
    exec('chromium-browser http://localhost:8000', (err, stdout, stderr) => {
        if (err) {
            console.error(`Error opening browser: ${stderr}`);
        } else {
            console.log("Browser opened");
        }
    });
});