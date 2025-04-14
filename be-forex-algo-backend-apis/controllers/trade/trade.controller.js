const DB = require("../../models");
const { response } = require('../../helpers');
const { activeSymbols, sendMessageToDLL } = require("../../service/tcp/tcpClient.service");

module.exports = {

    Trade: async (req, res) => {
        if (!activeSymbols.has(req.body.symbol)) {
            activeSymbols.add(req.body.symbol);
            sendMessageToDLL({ action: "SUBSCRIBE", symbol: req.body.symbol });
            return response.OK({ res, message: "Symbol subscribed successfully" });
        } else {
            activeSymbols.delete(req.body.symbol);
            sendMessageToDLL({ action: "UNSUBSCRIBE", symbol: req.body.symbol });
            return response.OK({ res, message: "Symbol unsubscribed successfully" });
        }
    },

};
