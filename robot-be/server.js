const net = require("net");
const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;

// TCP Client Configuration
const TCP_HOST = "127.0.0.1";
const TCP_PORT = 5050;
let client = null;

// Store active symbols being streamed
const activeSymbols = new Set();

// Create a persistent connection to the DLL
function connectToDLL() {
  client = new net.Socket();
  client.connect(TCP_PORT, TCP_HOST, () => {
    console.log(`✅ [Node.js] Connected to DLL on ${TCP_HOST}:${TCP_PORT}`);
  });

  client.on("data", (data) => {
    const message = data.toString().trim();
    if (!message.startsWith("[Node]")) {
      console.log(`${message}`);
    }
  });

  client.on("close", () => {
    console.log("🔌 [Node.js] Connection closed. Reconnecting...");
    setTimeout(connectToDLL, 1000);
  });

  client.on("error", (err) => console.error(`❌ [Node.js] TCP Error: ${err.message}`));
}

// Send JSON message to DLL
function sendMessageToDLL(jsonObject) {
  if (client && !client.destroyed) {
    const message = JSON.stringify(jsonObject);
    client.write(message);
    console.log(`➡️ [Node.js] Sent to DLL: ${message}`);
  } else {
    console.error("❌ [Node.js] DLL connection not established!");
  }
}

// API to request price streaming for a symbol
app.post("/send", (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  if (!activeSymbols.has(symbol)) {
    activeSymbols.add(symbol);
    sendMessageToDLL({ action: "SUBSCRIBE", symbol });
    console.log(`📩 [Node.js] Subscription requested: ${symbol}`);
    res.json({ success: true, message: `Subscribed to ${symbol}` });
  } else {
    res.json({ success: false, message: `Already subscribed to ${symbol}` });
  }
});

// API to stop price streaming for a symbol
app.post("/stop", (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  if (activeSymbols.has(symbol)) {
    activeSymbols.delete(symbol);
    sendMessageToDLL({ action: "UNSUBSCRIBE", symbol });
    console.log(`📤 [Node.js] Unsubscription requested: ${symbol}`);
    res.json({ success: true, message: `Unsubscribed from ${symbol}` });
  } else {
    res.json({ success: false, message: `Symbol ${symbol} was not subscribed` });
  }
});

// Start Express and connect to DLL
app.listen(port, () => {
  console.log(`🚀 [Node.js] API running at http://localhost:${port}`);
  connectToDLL();
});
