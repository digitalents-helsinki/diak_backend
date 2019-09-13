"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const controllers_1 = __importDefault(require("./controllers"));
const typeorm_1 = require("typeorm");
const app = express_1.default();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(cors_1.default());
app.use(controllers_1.default());
typeorm_1.createConnection({
    type: 'postgres',
    host: 'localhost',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB,
    synchronize: true
}).then(connection => {
    app.listen(process.env.PORT, () => {
        console.log(`app listening on port ${process.env.PORT}`);
    });
});
