function analyzeLogs(parsedData) {

    const logs = parsedData.logs;

    const summary = {
        totalRequests: logs.length,
        uniqueIPs: 0,
        getRequests: 0,
        postRequests: 0
    };

    const uniqueIPs = new Set();

    const methods = {};

    const statusCodes = {};

    const topIPs = {};

    const topEndpoints = {};

    logs.forEach(log => {

        uniqueIPs.add(log.ip);

        methods[log.method] = (methods[log.method] || 0) + 1;

        if (log.method === "GET") {
            summary.getRequests++;
        }

        if (log.method === "POST") {
            summary.postRequests++;
        }

        statusCodes[log.status] = (statusCodes[log.status] || 0) + 1;

        topIPs[log.ip] = (topIPs[log.ip] || 0) + 1;

        topEndpoints[log.endpoint] = (topEndpoints[log.endpoint] || 0) + 1;

    });

    summary.uniqueIPs = uniqueIPs.size;

    const sortedIPs = Object.entries(topIPs)
        .sort((a, b) => b[1] - a[1]);

    const sortedEndpoints = Object.entries(topEndpoints)
        .sort((a, b) => b[1] - a[1]);

    return {

        summary,

        methods,

        statusCodes,

        topIPs: sortedIPs,

        topEndpoints: sortedEndpoints

    };

}

module.exports = analyzeLogs;