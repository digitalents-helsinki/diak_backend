'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const uuidv4 = require('uuid/v4');
const { UserService } = require('../services/user').default;
module.exports = (app, db) => {
    app.post("/user/create", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        /*
        db.models.User.create({
          userId: uuidv4(),
          email: req.body.email,
          name: req.body.name,
          gender: req.body.gender
        })
        */
        const userDTO = req.body;
        const { user } = yield UserService.SignUp(userDTO);
        return res.json({ user });
    }));
    app.get("/user/:id", (req, res) => {
        db.models.User.findAll({
            where: {
                userId: req.params.id
            }
        }).then((result) => res.json(result));
    });
    app.get("/user/:id/results", (req, res) => {
        db.models.User.findAll({
            where: {
                userId: req.params.id
            }
        }).then(result => res.json(result.getSurveyResults));
    });
};
