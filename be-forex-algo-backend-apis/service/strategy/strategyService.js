const trackedSymbols = new Set(["XAUUSD", "XAUEUR"]);
const activeTrades = {};

const GAP = 2;
const CP_RANGE = 100;
const TP_CHECKPOINTS = 2;
const EPSILON = 0.30; // Updated from 0.01 to 0.30

function generateCheckpoints(basePrice, gap = GAP, range = CP_RANGE) {
    const checkpoints = new Set();
    for (let i = 1; i <= range; i++) {
        checkpoints.add((basePrice + gap * i).toFixed(2));
        checkpoints.add((basePrice - gap * i).toFixed(2));
    }
    checkpoints.add(basePrice.toFixed(2));
    return checkpoints;
}

function handlePriceUpdate(data) {
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const { symbol, bid } = parsed;
        const price = parseFloat(bid);

        if (!trackedSymbols.has(symbol) || isNaN(price)) return;

        const trade = activeTrades[symbol];

        // No trade yet → wait for next movement to decide direction
        if (!trade) {
            activeTrades[symbol] = {
                direction: null,
                entryPrice: null,
                checkpoint: price,
                checkpoints: generateCheckpoints(price),
            };
            console.log(`📌 ${symbol} Tracking initialized at ${price.toFixed(2)} | Waiting for movement`);
            return;
        }

        // If direction is null, determine it based on movement
        if (!trade.direction) {
            const movement = price - trade.checkpoint;
            if (Math.abs(movement) >= EPSILON) {
                const direction = movement > 0 ? "BUY" : "SELL";
                trade.direction = direction;
                trade.entryPrice = price;
                trade.checkpoint = price;
                trade.checkpoints = generateCheckpoints(price);
                console.log(`✅ ${symbol} Initial ${direction} at ${price.toFixed(2)} | Checkpoint: ${price.toFixed(2)}`);
            }
            return;
        }

        const { direction, checkpoint } = trade;

        const takeProfitLevel = direction === "BUY"
            ? checkpoint + GAP * TP_CHECKPOINTS
            : checkpoint - GAP * TP_CHECKPOINTS;

        const stopLossLevel = checkpoint; // SL = checkpoint as per your rule

        if (direction === "BUY") {
            if (price >= takeProfitLevel) {
                console.log(`💰 ${symbol} BUY → TP hit at ${price.toFixed(2)} | Prev Checkpoint: ${checkpoint.toFixed(2)}`);
                trade.entryPrice = price;
                trade.checkpoint = price;
                trade.checkpoints = generateCheckpoints(price);
                console.log(`🔁 ${symbol} Reentered BUY at ${price.toFixed(2)} | New Checkpoint: ${price.toFixed(2)}`);
            } else if (price <= stopLossLevel - EPSILON) {
                console.log(`🛑 ${symbol} BUY → SL hit at ${price.toFixed(2)} | Prev Checkpoint: ${checkpoint.toFixed(2)}`);
                trade.direction = "SELL";
                trade.entryPrice = price;
                trade.checkpoint = price;
                trade.checkpoints = generateCheckpoints(price);
                console.log(`🔃 ${symbol} Switched to SELL at ${price.toFixed(2)} | New Checkpoint: ${price.toFixed(2)}`);
            }
        }

        else if (direction === "SELL") {
            if (price <= takeProfitLevel) {
                console.log(`💰 ${symbol} SELL → TP hit at ${price.toFixed(2)} | Prev Checkpoint: ${checkpoint.toFixed(2)}`);
                trade.entryPrice = price;
                trade.checkpoint = price;
                trade.checkpoints = generateCheckpoints(price);
                console.log(`🔁 ${symbol} Reentered SELL at ${price.toFixed(2)} | New Checkpoint: ${price.toFixed(2)}`);
            } else if (price >= stopLossLevel + EPSILON) {
                console.log(`🛑 ${symbol} SELL → SL hit at ${price.toFixed(2)} | Prev Checkpoint: ${checkpoint.toFixed(2)}`);
                trade.direction = "BUY";
                trade.entryPrice = price;
                trade.checkpoint = price;
                trade.checkpoints = generateCheckpoints(price);
                console.log(`🔃 ${symbol} Switched to BUY at ${price.toFixed(2)} | New Checkpoint: ${price.toFixed(2)}`);
            }
        }
    } catch (err) {
        console.error("❌ Strategy Error:", err.message);
    }
}

module.exports = { handlePriceUpdate };
