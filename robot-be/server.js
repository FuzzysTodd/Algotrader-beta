// Import WebSocket library
const WebSocket = require('ws');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server is running on ws://localhost:8080");

// Handle connection event
wss.on('connection', (ws) => {
  console.log('MetaTrader connected');

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = message.toString();
      console.log('Received Data:', data);

      // Validate data format
      const parts = data.split(',');
      if (parts.length !== 3) throw new Error("Invalid data format");

      const [pair, bid, ask] = parts;
      if (isNaN(bid) || isNaN(ask)) throw new Error("Bid/Ask should be numbers");

      console.log(`Pair: ${pair} | Bid: ${bid} | Ask: ${ask}`);
    } catch (error) {
      console.error("Error processing message:", error.message);
    }
  });

  ws.on('error', (err) => console.error("WebSocket error:", err.message));
  ws.on('close', () => console.log('MetaTrader disconnected'));
});

// Handle server errors
wss.on('error', (err) => console.error("WebSocket Server Error:", err.message));
