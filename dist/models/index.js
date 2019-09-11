"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
typeorm_1.createConnection({
    type: 'postgres',
    host: 'localhost',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB
}).then(conn => {
    console.log("conn established");
})
    .catch(err => {
    console.log("err", err);
});
