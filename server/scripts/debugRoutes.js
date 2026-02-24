import express from "express";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

function printRoutes(stack, prefix = "") {
    stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
            console.log(`${methods} ${prefix}${layer.route.path}`);
        } else if (layer.name === "router" && layer.handle.stack) {
            printRoutes(layer.handle.stack, prefix + (layer.regexp.source.replace("^\\", "").replace("\\/?(?=\\/|$)", "") || ""));
        }
    });
}

console.log("Registered Routes:");
printRoutes(app._sw._router.stack); // This might vary depending on express version
// Since I can't easily access the internal stack of the running server without modifying it
// I will just add a console.log to server.js instead.
