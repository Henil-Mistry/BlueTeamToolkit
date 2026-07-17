const express = require("express");
const cors = require("cors");
const path = require("path");
const uploadRoute = require("./routes/upload");
const reportsRoute = require("./routes/reports");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoute);
app.use("/api/reports", reportsRoute);

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        message: "Blue Team Toolkit backend is running!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});