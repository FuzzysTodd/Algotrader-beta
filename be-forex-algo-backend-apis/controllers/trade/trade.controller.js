const { response } = require("../../helpers");
const { redis } = require("../../config/redis.config");
const { sendMessageToDLL } = require("../../service/tcp/tcpClient.service");

const ACTIVE_SYMBOLS_KEY = "active:symbols";

module.exports = {
    Trade: async (req, res) => {
        const { symbol, GAP, ECLIPSE_BUFFER, volume } = req.body;
        const isActive = await redis.sismember(ACTIVE_SYMBOLS_KEY, symbol);

        if (!isActive) {
            // Store in set
            await redis.sadd(ACTIVE_SYMBOLS_KEY, symbol);

            // Store full config as hash
            await redis.hset(`symbol_config:${symbol}`, {
                symbol,
                GAP,
                ECLIPSE_BUFFER,
                volume,
            });

            // Send subscription message to DLL
            sendMessageToDLL({
                action: "SUBSCRIBE",
                symbol,
                GAP,
                ECLIPSE_BUFFER,
                volume
            });

            return response.OK({ res, message: "Symbol subscribed successfully" });

        } else {
            // Remove from set
            await redis.srem(ACTIVE_SYMBOLS_KEY, symbol);

            // Remove symbol config hash
            await redis.del(`symbol_config:${symbol}`);

            // Remove checkpoints hash
            await redis.del(`checkpoint:${symbol}`);

            // Send unsubscription message to DLL
            sendMessageToDLL({
                action: "UNSUBSCRIBE",
                symbol
            });

            return response.OK({ res, message: "Symbol unsubscribed successfully" });
        }
    },

    getActiveSymbols: async (req, res) => {
        const symbols = await redis.smembers(ACTIVE_SYMBOLS_KEY);
        const configs = [];

        for (const symbol of symbols) {
            const config = await redis.hgetall(`symbol_config:${symbol}`);
            configs.push(config);
        }

        return response.OK({
            res,
            message: "Active symbols fetched successfully",
            data: configs,
        });
    },
};
