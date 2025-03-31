const net = require("net");
const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;

// TCP Client Configuration
const TCP_HOST = "127.0.0.1";
const TCP_PORT = 5050;
let client = null;

// Create a persistent connection to the DLL
function connectToDLL() {
  client = new net.Socket();
  client.connect(TCP_PORT, TCP_HOST, () => {
    console.log(`✅ Connected to DLL on ${TCP_HOST}:${TCP_PORT}`);
  });

  // Handle responses from DLL
  client.on("data", (data) => {
    const message = data.toString();
    // Ignore [Node] messages to prevent loops
    if (!message.startsWith("[Node]")) {
      console.log("⬅️ Response from DLL:", message);
    }
  });

  client.on("close", () => {
    console.log("🔌 Connection closed. Reconnecting...");
    setTimeout(connectToDLL, 1000); // Auto-reconnect
  });

  client.on("error", (err) => console.error("❌ TCP Error:", err.message));
}

// Send message to DLL (tag with [Node])
function sendMessageToDLL(message) {
  if (client && !client.destroyed) {
    const taggedMessage = `[Node] ${message}`;
    client.write(taggedMessage);
    console.log(`➡️ Sent: ${taggedMessage}`);
  } else {
    console.error("❌ DLL connection not established!");
  }
}

// Express API for sending messages
app.post("/send", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  sendMessageToDLL(message);
  res.json({ success: true, message: `Sent: [Node] ${message}` });
});

// Start Express and connect to DLL
app.listen(port, () => {
  console.log(`🚀 API running at http://localhost:${port}`);
  connectToDLL();
});
