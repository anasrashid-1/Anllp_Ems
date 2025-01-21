const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
    const authorization_header = req.headers.authorization;
    if (!authorization_header) {
        return res.status(400).json({ message: "Token is missing in request." });
    }
    const token = authorization_header.split(" ")[1];
    if (!token) {
        return res.status(400).json({ message: "Token format is incorrect." });
    }

    jwt.verify(token, "secret_key", function (err, decoded) {
        if (err) {
            return res.status(400).json({ message: "Login first" });
        } else {
            let userId;
            if (decoded.userId) {
                userId = decoded.userId;
                req.userId = userId;
            }
            next();
        }
    });
};


module.exports = {authMiddleware};