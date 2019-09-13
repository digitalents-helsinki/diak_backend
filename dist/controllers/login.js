const jwt = require('jsonwebtoken');
module.exports = app => {
    app.post('/login', (req, res) => {
        const user = req.body.user;
        const pass = req.body.pass;
        if (user && pass) {
            if (user === process.env.FRONT_USER && pass === process.env.FRONT_PASS) {
                const token = jwt.sign({ user: user }, process.env.JWT_KEY, {
                    expiresIn: '24h'
                });
                res.json({
                    success: true,
                    message: 'Auth success',
                    token: token
                });
            }
            else {
                res.json({
                    success: false,
                    message: 'Incorrect'
                });
            }
        }
        else {
            res.json({
                success: false,
                message: 'Fail'
            });
        }
    });
};
