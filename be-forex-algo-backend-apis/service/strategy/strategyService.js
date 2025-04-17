let checkpoints = {};
let RANGE = 5;  // Default RANGE value
let GAP = 2;  // Default GAP value
let ECLIPSE_BUFFER = 0.30;  // Default ECLIPSE_BUFFER value

function floorCheckpoint(price) {
    return Math.floor(price);
}

function generateCheckpointRange(cp) {
    const prevs = Array.from({ length: RANGE }, (_, i) => cp - GAP * (i + 1)).reverse();
    const nexts = Array.from({ length: RANGE }, (_, i) => cp + GAP * (i + 1));
    return { prevs, nexts };
}

function logTrade(symbol, price, direction, cp) {
    const { prevs, nexts } = generateCheckpointRange(cp);
    const prev = prevs[prevs.length - 1];
    const next = nexts[0];
    const emoji = direction === 'BUY' ? '📈' : '📉';
    console.log(`${emoji} ${symbol}: ${price.toFixed(2)} | ${direction} | Current: ${cp} | Prev: ${prev} | Next: ${next}`);
}

function logSkip(symbol, price, cp, direction) {
    const { prevs, nexts } = generateCheckpointRange(cp);
    const prev = prevs[prevs.length - 1];
    const next = nexts[0];
    const emoji = direction === 'BUY' ? '⏭️' : '⏮️';
    console.log(`${emoji} ${symbol}: ${price.toFixed(2)} | Skip re-entry | Current: ${cp} | Prev: ${prev} | Next: ${next}`);
}

function logInitialization(symbol, price, cp) {
    console.log(`📌 ${symbol}: ${price.toFixed(2)} initialized | Current: ${cp} | Waiting for movement...`);
}

// Handle price updates and dynamically update GAP and ECLIPSE_BUFFER from the incoming data
function handlePriceUpdate(data) {
    try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const { symbol, bid, GAP: dynamicGAP, ECLIPSE_BUFFER: dynamicEclipseBuffer } = parsed;

        if (!symbol || typeof bid !== 'number') return;

        // Update GAP and ECLIPSE_BUFFER if provided
        if (dynamicGAP) GAP = dynamicGAP;
        if (dynamicEclipseBuffer) ECLIPSE_BUFFER = dynamicEclipseBuffer;

        const price = parseFloat(bid);
        const newCP = floorCheckpoint(price);

        if (!checkpoints[symbol]) {
            checkpoints[symbol] = {
                current: newCP,
                direction: null,
                initialTraded: false
            };
            logInitialization(symbol, price, newCP);
            return;
        }

        const state = checkpoints[symbol];
        const { current, direction, initialTraded } = state;

        const { prevs, nexts } = generateCheckpointRange(current);
        const nextCP = nexts[0];
        const prevCP = prevs[prevs.length - 1];

        // 🚀 Initial movement with eclipse buffer
        if (!initialTraded && newCP !== current) {
            if (Math.abs(price - current) >= ECLIPSE_BUFFER) {
                const initialDirection = price > current ? 'BUY' : 'SELL';
                checkpoints[symbol] = { current: newCP, direction: initialDirection, initialTraded: true };
                logTrade(symbol, price, initialDirection, newCP);
            }
            return;
        }

        // ⬆️ BUY Logic
        if (direction === 'BUY') {
            if (price >= nextCP) {
                const newCP = floorCheckpoint(price);
                if (newCP > current) {
                    checkpoints[symbol] = { current: newCP, direction: 'BUY', initialTraded: true };
                    logTrade(symbol, price, 'BUY', newCP); // ✅ Log real trade
                }
            } else if (price < current) {
                const newSellCP = floorCheckpoint(price);
                if (newSellCP < current) {
                    checkpoints[symbol] = { current: newSellCP, direction: 'SELL', initialTraded: true };
                    logTrade(symbol, price, 'SELL', newSellCP);
                }
            }
        }

        // ⬇️ SELL Logic
        else if (direction === 'SELL') {
            if (price <= prevCP) {
                const newCP = floorCheckpoint(price);
                if (newCP < current) {
                    checkpoints[symbol] = { current: newCP, direction: 'SELL', initialTraded: true };
                    logTrade(symbol, price, 'SELL', newCP); // ✅ Log real trade
                }
            } else if (price > current) {
                const newBuyCP = floorCheckpoint(price);
                if (newBuyCP > current) {
                    checkpoints[symbol] = { current: newBuyCP, direction: 'BUY', initialTraded: true };
                    logTrade(symbol, price, 'BUY', newBuyCP);
                }
            }
        }

    } catch (err) {
        console.error("❌ JSON Parse Error:", err.message);
        console.error("Offending message:", data);
    }
}

module.exports = { handlePriceUpdate };
