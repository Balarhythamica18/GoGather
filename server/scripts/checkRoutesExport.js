import express from "express";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
app.use("/admin", adminRoutes);

console.log("Registered routes in adminRoutes.js:");
app._router.stack.forEach((middleware) => {
    if (middleware.name === "router") {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                console.log(`${Object.keys(handler.route.methods).join(", ").toUpperCase()} ${handler.route.path}`);
            }
        });
    }
});
