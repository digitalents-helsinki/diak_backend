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
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../services/auth");
exports.default = (app, db) => {
    app.post('/user/create', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const userDTO = req.body;
        const { user } = yield auth_1.AuthService.SignUp(userDTO);
        return res.json({ user });
    }));
    app.get('/user/:id', (req, res) => {
        db.models.User.findOne({
            where: {
                email: req.params.email
            }
        }).then(result => res.json(result));
    });
};
