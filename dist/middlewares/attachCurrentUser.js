var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { UserModel } = require('../models/user').default;
module.exports = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const decodedTokenData = req.tokenData;
    const userRecord = yield UserModel.findOne({ _id: decodedTokenData._id });
    req.currentUser = userRecord;
    if (!userRecord) {
        return res.status(401).end('User not found');
    }
    else {
        return next();
    }
});
