"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginInput = exports.validateRegisterInput = void 0;
const joi_1 = __importDefault(require("joi"));
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    username: joi_1.default.string().min(3).max(30).required(),
    password: joi_1.default.string().min(6).required(),
    fullName: joi_1.default.string().max(100).required()
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
const validateRegisterInput = (req, res, next) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.validateRegisterInput = validateRegisterInput;
const validateLoginInput = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.validateLoginInput = validateLoginInput;
