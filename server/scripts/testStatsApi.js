import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const testStatsApi = async () => {
    try {
        // Generate a temporary admin token
        const token = jwt.sign(
            { id: "67bc9dbcc18db0d24c081878", role: "admin" }, // Using a dummy ID or real one if known
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("Testing Events API with token...");

        const res = await axios.get("http://localhost:5000/api/admin/events", {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));

    } catch (error) {
        if (error.response) {
            const fs = await import("fs");
            fs.writeFileSync("error_debug.json", JSON.stringify(error.response.data, null, 2));
            console.error("API Error Response written to error_debug.json");
        } else {
            console.error("Connection Error:", error.message);
        }
    }
};

testStatsApi();
