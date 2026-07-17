const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const REPORTS_FOLDER = path.join(__dirname, "..", "reports");
const UPLOADS_FOLDER = path.join(__dirname, "..", "uploads");

// ============================
// List all reports
// ============================

router.get("/", (req, res) => {

    try {

        const reports = fs.readdirSync(REPORTS_FOLDER)
            .filter(file => file.endsWith(".json"))
            .sort()
            .reverse();

        res.json({

            success: true,

            reports

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: "Unable to load reports."

        });

    }

});

// ============================
// Load one report
// ============================

router.get("/:filename", (req, res) => {

    try {

        const reportPath = path.join(
            REPORTS_FOLDER,
            req.params.filename
        );

        if (!fs.existsSync(reportPath)) {

            return res.status(404).json({

                success: false,

                message: "Report not found."

            });

        }

        const report = JSON.parse(
            fs.readFileSync(reportPath, "utf8")
        );

        res.json(report);

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: "Unable to load report."

        });

    }

});

// Delete Investigation
router.delete("/:filename", (req, res) => {

    try {

        const reportFile = req.params.filename;

        const mode = req.query.mode || "investigation";

        const reportPath = path.join(
            REPORTS_FOLDER,
            reportFile
        );

        if (!fs.existsSync(reportPath)) {

            return res.status(404).json({

                success: false,

                message: "Report not found."

            });

        }

        const logFile = reportFile.replace(".json", ".log");

        const logPath = path.join(
            UPLOADS_FOLDER,
            logFile
        );

        // Delete Snapshot Only
        if (mode === "snapshot") {

            if (fs.existsSync(logPath)) {

                fs.unlinkSync(logPath);

            }

            return res.json({

                success: true,

                message: "Snapshot deleted successfully."

            });

        }

        // Delete Entire Investigation

        fs.unlinkSync(reportPath);

        if (fs.existsSync(logPath)) {

            fs.unlinkSync(logPath);

        }

        return res.json({

            success: true,

            message: "Investigation deleted successfully."

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: "Unable to delete investigation."

        });

    }

});
module.exports = router;