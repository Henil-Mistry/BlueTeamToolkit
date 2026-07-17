const fs = require("fs");

function parseLog(filePath) {

    const fileContent = fs.readFileSync(filePath, "utf8");

    const lines = fileContent.split("\n");

    const logs = [];

    let parsedLines = 0;
    let skippedLines = 0;

    lines.forEach((line, index) => {

        line = line.trim();

        if (!line) {
            return;
        }

        const parts = line.split(" | ");

        if (parts.length !== 6) {
            skippedLines++;
            return;
        }

        const timestamp = parts[0];
        const ip = parts[1];

        const requestParts = parts[2].split(" ");

        if (requestParts.length < 2) {
            skippedLines++;
            return;
        }

        const method = requestParts[0];
        const endpoint = requestParts.slice(1).join(" ");

        const status = Number(parts[3].replace("status=", ""));
        const bytes = Number(parts[4].replace("bytes=", ""));
        const userAgent = parts[5]
            .replace('ua="', "")
            .replace(/"$/, "");

        logs.push({
            line: index + 1,
            timestamp,
            ip,
            method,
            endpoint,
            status,
            bytes,
            userAgent
        });

        parsedLines++;

    });

    return {
        filename: filePath.split("/").pop(),
        totalLines: lines.length,
        parsedLines,
        skippedLines,
        logs
    };

}

module.exports = parseLog;