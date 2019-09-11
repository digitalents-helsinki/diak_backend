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
const typeorm_1 = require("typeorm");
const user_1 = __importDefault(require("./entity/user"));
let repository;
const init = () => {
    const connection = typeorm_1.getConnection();
    repository = connection.getRepository(user_1.default);
};
exports.createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (repository === undefined) {
        init();
    }
    const user = new user_1.default();
    user.name = req.name;
    yield repository.save(user);
    res.send(user);
});
exports.readUsers = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (repository === undefined) {
        init();
    }
    const users = yield repository.find();
    res.send(users);
});
