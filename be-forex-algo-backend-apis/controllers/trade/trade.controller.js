const DB = require("../../models");
const { response } = require('../../helpers');
const { activeSymbols, sendMessageToDLL } = require("../../service/tcp/tcpClient.service");

module.exports = {

    Trade: async (req, res) => {
        const { symbol, GAP, ECLIPSE_BUFFER } = req.body;

        if (!activeSymbols.has(symbol)) {
            activeSymbols.add(symbol);

            sendMessageToDLL({ 
                action: "SUBSCRIBE", 
                symbol,
                GAP,
                ECLIPSE_BUFFER
            });

            return response.OK({ res, message: "Symbol subscribed successfully" });
        } else {
            activeSymbols.delete(symbol);
            sendMessageToDLL({ action: "UNSUBSCRIBE", symbol: symbol });
            return response.OK({ res, message: "Symbol unsubscribed successfully" });
        }
    },

};
