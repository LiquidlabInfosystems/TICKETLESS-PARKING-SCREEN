const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 8000;

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


app.listen(PORT, "192.168.1.5",() => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Automatically open the browser
    exec('chromium-browser http://localhost:3000', (err, stdout, stderr) => {
        if (err) {
            console.error(`Error opening browser: ${stderr}`);
        } else {
            console.log("Browser opened");
        }
    });
});