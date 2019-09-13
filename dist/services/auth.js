"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const typedi_1 = require("typedi");
const argon2_1 = require("argon2");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../entity/user");
const typeorm_1 = require("typeorm");
let AuthService = class AuthService {
    generateToken(user) {
        const data = {
            id: user.userId,
            name: user.name,
            email: user.email
        };
        const signature = 'SHH';
        const expiration = '6h';
        return jsonwebtoken_1.default.sign({ data }, signature, { expiresIn: expiration });
    }
    SignIn(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRecord = yield typeorm_1.getRepository(user_1.User).findOne({ email: email });
            if (!userRecord) {
                throw new Error('User not found');
            }
            const correctPassword = yield argon2_1.verify(userRecord.password, password);
            if (correctPassword) {
                const token = this.generateToken(userRecord);
                const user = userRecord;
                /*
                Reflect.deleteProperty(user, 'password')
                Reflect.deleteProperty(user, 'salt')
                */
                return { user, token };
            }
            else {
                throw new Error('Invalid password');
            }
        });
    }
    SignUp(email, password, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const passwordHashed = yield argon2_1.hash(password);
            const userRecord = yield typeorm_1.getRepository(user_1.User).create({
                password: passwordHashed,
                email,
                name
            });
            typeorm_1.getRepository(user_1.User).save(userRecord);
            return {
                user: {
                    email: userRecord.email,
                    name: userRecord.name
                }
            };
        });
    }
};
AuthService = __decorate([
    typedi_1.Service()
], AuthService);
exports.default = AuthService;
