import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
	const authHeader = req.header("Authorization");
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		console.error("Token verification failed:", error);

		if (error.name === "TokenExpiredError") {
			return res
				.status(401)
				.json({ error: "Session expired. Please log in again." });
		}

		res.status(403).json({ error: "Invalid token." });
	}
};
