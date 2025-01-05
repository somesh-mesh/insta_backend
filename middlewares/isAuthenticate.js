import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
    try {
        const token = req.cookies.token; // Ensure the correct cookie name

        // Check if token is available
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied", success: false });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Synchronously verify JWT

        // Attach user ID to req.user instead of req.id
        req.user = { id: decoded.userId }; // Assuming the token payload contains 'userId'

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Handle specific JWT errors for better clarity
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired, please log in again.", success: false });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token, authorization denied.", success: false });
        }

        // Log other unexpected errors
        console.error("Authentication error: ", error);
        return res.status(500).json({ message: "Server Error", success: false });
    }
};

export default isAuthenticated;