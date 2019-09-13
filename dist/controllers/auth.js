"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typedi_1 = require("typedi");
const auth_1 = __importDefault(require("../services/auth"));
const celebrate_1 = require("celebrate");
const route = express_1.Router();
exports.default = app => {
    app.use('/auth', route);
    route.post('/signup', celebrate_1.celebrate({
        body: celebrate_1.Joi.object({
            name: celebrate_1.Joi.string().required(),
            email: celebrate_1.Joi.string().required(),
            password: celebrate_1.Joi.string().required()
        })
    }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const authServiceInstance = typedi_1.Container.get(auth_1.default);
            const { user, token } = yield authServiceInstance.SignUp(req.body.email, req.body.password, req.body.name);
            return res.status(201).json({ user, token });
        }
        catch (e) {
            throw new Error(e);
        }
    }));
    route.post('/signin', celebrate_1.celebrate({
        body: celebrate_1.Joi.object({
            email: celebrate_1.Joi.string().required(),
            password: celebrate_1.Joi.string().required()
        })
    }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            const authServiceInstance = typedi_1.Container.get(auth_1.default);
            const { user, token } = yield authServiceInstance.SignIn(email, password);
            return res.json({ user, token }).status(200);
        }
        catch (e) {
            throw new Error(e);
        }
    }));
};
