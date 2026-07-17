const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const parseLog = require("../utils/parser");
const analyzeLogs = require("../utils/analyzer");

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/");

    },

    filename: (req, file, cb) => {

    const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "");

    const originalName = path.parse(file.originalname).name;

    const safeName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    cb(null, `${safeName}_${timestamp}.log`);

}

});

// Allow only .log files
const upload = multer({

    storage,

    fileFilter: (req, file, cb) => {

        if (file.originalname.toLowerCase().endsWith(".log")) {

            cb(null, true);

        }

        else {

            cb(new Error("Only .log files are allowed."));

        }

    }

});

// Upload Route
router.post("/", upload.single("logfile"), (req, res) => {

    const filePath = path.join("uploads", req.file.filename);

    const parsedData = parseLog(filePath);

    const analysis = analyzeLogs(parsedData);

    const response = {

        success: true,

        message: "Log uploaded, parsed and analyzed successfully.",

        parsedData,

        analysis

    };

    // Save investigation report
    const reportName = req.file.filename.replace(".log", ".json");

    const reportPath = path.join("reports", reportName);

    fs.writeFileSync(

        reportPath,

        JSON.stringify(response, null, 4)

    );

    res.json(response);

});

// Error Handler
router.use((err, req, res, next) => {

    res.status(400).json({

        success: false,

        message: err.message

    });

});

module.exports = router;