const Joi = require("joi");
const { constants: { ENUM: { ROLE } } } = require("../../helpers");
const validator = require("../../middleware/validator");


module.exports = {

    Trade: validator({
        body: Joi.object({
            symbol: Joi.string().required(),
            GAP: Joi.number().required(),
            ECLIPSE_BUFFER: Joi.number().required(),
            volume: Joi.number().required(),
        }),
    }),

};
