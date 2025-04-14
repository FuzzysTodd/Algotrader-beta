const net = require("net");
const { logger } = require("../../helpers")
const { handlePriceUpdate } = require("../strategy/strategyService");

const TCP_HOST = "127.0.0.1";
const TCP_PORT = 5050;

let client = null;
const activeSymbols = new Set();

function connectToDLL() {
  client = new net.Socket();

  client.connect(TCP_PORT, TCP_HOST, () => {
    logger.info(`✔ [TCP] Connected to DLL on ${TCP_HOST}:${TCP_PORT}`);
  });

  let buffer = "";

  client.on("data", (data) => {
    buffer += data.toString();

    let delimiter = "\n";
    let parts = buffer.split(delimiter);
    buffer = parts.pop();

    for (let message of parts) {
      const sanitized = message.replace(/\0/g, '').trim();

      try {
        if (sanitized) {
          const json = JSON.parse(sanitized);
          // console.log("✅ Parsed JSON:", json);
          handlePriceUpdate(json);
        }
      } catch (e) {
        console.error("❌ JSON Parse Error:", e.message);
        console.error("Offending message:", sanitized);
      }
    }
  });

  client.on("close", () => {
    logger.warn("🛜 [TCP] Connection closed. Reconnecting...");
    setTimeout(connectToDLL, 1000);
  });

  client.on("error", (err) => {
    logger.error(`❌ [TCP] Connection error: ${err.message}`);
  });
}

function sendMessageToDLL(jsonObject) {
  if (client && !client.destroyed) {
    const message = JSON.stringify(jsonObject);
    client.write(message);
    logger.info(`➡️ [TCP] Sent to DLL: ${message}`);
  } else {
    logger.error("❌ [TCP] DLL connection not established!");
  }
}

function getActiveSymbols() {
  return Array.from(activeSymbols);
}

module.exports = {
  connectToDLL,
  getActiveSymbols,
  sendMessageToDLL,
  getClient: () => client,
  activeSymbols,
};
