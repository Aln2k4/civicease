const jwt = require('jsonwebtoken');
const Official = require('../models/Official');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user to check role
            req.user = await Official.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // STRICT: Check for village context in token, UNLESS user is Admin
            if (req.user.role !== 'Admin' && req.user.role !== 'admin' && !decoded.villageId) {
                return res.status(403).json({ message: 'Village context missing from token. please login again.' });
            }

            // Attach villageId strictly from token (or DB, but token is the signed contract)
            req.villageId = decoded.villageId || null;

            // Double check DB consistency (Optional but good for strictness)
            // if (req.user.villageOfficeId.toString() !== req.villageId) { ... }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, admin, authorize };
