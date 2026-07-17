const uploadButton = document.getElementById("uploadBtn");
const fileInput = document.getElementById("logFile");
const summaryCards = document.getElementById("summaryCards");
const highlights = document.getElementById("highlights");
const statusTable = document.querySelector("#statusTable tbody");
const ipTable = document.querySelector("#ipTable tbody");
const endpointTable = document.querySelector("#endpointTable tbody");
const logsTable = document.querySelector("#logsTable tbody");
const logCounter = document.getElementById("logCounter");
const lastUploaded = document.getElementById("lastUploaded");
const searchBox = document.getElementById("searchBox");
const PAGE_SIZE = 100;
let currentLogs = [];
let filteredLogs = [];
let currentPage = 1;

let activeFilter = "";
const filterBar = document.getElementById("filterBar");
const toast = document.getElementById("toast");
const reportSelector = document.getElementById("reportSelector");
const deleteSnapshotBtn = document.getElementById("deleteSnapshotBtn");
const deleteInvestigationBtn = document.getElementById("deleteInvestigationBtn");
const emptyState = document.getElementById("emptyState");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const jumpRequestInput = document.getElementById("jumpRequest");
const jumpButton = document.getElementById("jumpButton");

/* ---------- Dark Mode Toggle ---------- */

const themeToggle = document.getElementById("themeToggle");
const themeToggleIcon = document.getElementById("themeToggleIcon");

function applyTheme(theme) {

    if (theme === "dark") {

        document.documentElement.setAttribute("data-theme", "dark");
        themeToggleIcon.textContent = "☀️";

    } else {

        document.documentElement.removeAttribute("data-theme");
        themeToggleIcon.textContent = "🌙";

    }

}

applyTheme(localStorage.getItem("theme") || "light");

themeToggle.addEventListener("click", () => {

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";

    localStorage.setItem("theme", nextTheme);

    applyTheme(nextTheme);

});

/* ---------- Custom Confirmation Modal ---------- */

const confirmOverlay = document.getElementById("confirmOverlay");
const confirmTitleEl = document.getElementById("confirmTitle");
const confirmMessageEl = document.getElementById("confirmMessage");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmOkBtn = document.getElementById("confirmOkBtn");

function showConfirmDialog(title, message) {

    return new Promise((resolve) => {

        confirmTitleEl.textContent = title;
        confirmMessageEl.textContent = message;

        confirmOverlay.classList.add("show");

        function cleanup(result) {

            confirmOverlay.classList.remove("show");

            confirmOkBtn.removeEventListener("click", onConfirm);
            confirmCancelBtn.removeEventListener("click", onCancel);
            confirmOverlay.removeEventListener("click", onOverlayClick);
            document.removeEventListener("keydown", onKeydown);

            resolve(result);

        }

        function onConfirm() {
            cleanup(true);
        }

        function onCancel() {
            cleanup(false);
        }

        function onOverlayClick(event) {

            if (event.target === confirmOverlay) {
                cleanup(false);
            }

        }

        function onKeydown(event) {

            if (event.key === "Escape") {
                cleanup(false);
            }

        }

        confirmOkBtn.addEventListener("click", onConfirm);
        confirmCancelBtn.addEventListener("click", onCancel);
        confirmOverlay.addEventListener("click", onOverlayClick);
        document.addEventListener("keydown", onKeydown);

    });

}

uploadButton.addEventListener("click", async () => {

    const file = fileInput.files[0];

    if (!file) {
        showToast("Please select a log file.", "error");
        return;
    }

    if (!file.name.toLowerCase().endsWith(".log")) {
        showToast("Only .log files are allowed.", "error");
        return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";

    const formData = new FormData();
    formData.append("logfile", file);

    try {

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        uploadButton.textContent = "Analyzing...";

        if (!response.ok) {

            uploadButton.textContent = "Upload Log";
            uploadButton.disabled = false;

            showToast(data.message, "error");
            return;

        }

        loadDashboard(data);

        showToast(`Loaded ${data.parsedData.filename}`, "success");

        lastUploaded.textContent =
            `Loaded Snapshot: ${data.parsedData.filename}`;

        localStorage.setItem("lastReport", data.parsedData.filename);

        await refreshReportsDropdown(data.parsedData.filename);

        fileInput.value = "";

        uploadButton.textContent = "Upload Log";

        uploadButton.disabled = false;
    }

    catch (error) {

        console.error(error);

        uploadButton.textContent = "Upload Log";
        uploadButton.disabled = false;

        showToast("Unable to connect to the server.", "error");

    }

});

function loadDashboard(data) {

    hideEmptyState();

    currentLogs = data.parsedData.logs;
    filteredLogs = [...currentLogs];
    currentPage = 1;
    
    loadSummary(data.analysis.summary);

    loadHighlights(data.analysis);

    loadStatusCodes(data.analysis.statusCodes);

    loadTopIPs(data.analysis.topIPs);

    loadTopEndpoints(data.analysis.topEndpoints);
    
    buildFilters(data.analysis.methods, data.analysis.statusCodes);

    renderCurrentPage();

    deleteSnapshotBtn.disabled = false;

    deleteInvestigationBtn.disabled = false;

}

function loadSummary(summary) {

    summaryCards.innerHTML = "";

    const cards = [

        ["Total Requests", summary.totalRequests],

        ["Unique IPs", summary.uniqueIPs],

        ["GET Requests", summary.getRequests],

        ["POST Requests", summary.postRequests]

    ];

    cards.forEach(card => {

        summaryCards.innerHTML += `
            <div class="summaryCard">

                <h3>${card[0]}</h3>

                <p>${card[1]}</p>

            </div>
        `;

    });

}

function loadStatusCodes(statusCodes) {

    statusTable.innerHTML = "";

    Object.entries(statusCodes).forEach(([status, count]) => {

        statusTable.innerHTML += `
            <tr>

                <td>${status}</td>

                <td>${count}</td>

            </tr>
        `;

    });

}

function loadTopIPs(ips) {

    ipTable.innerHTML = "";

    ips.slice(0, 10).forEach(ip => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="clickable">${ip[0]}</td>
            <td>${ip[1]}</td>
        `;

        row.cells[0].style.cursor = "pointer";

        row.cells[0].onclick = () => {

            searchBox.value = ip[0];

            applyFilters();

        };

        ipTable.appendChild(row);

    });

}

function loadTopEndpoints(endpoints) {

    endpointTable.innerHTML = "";

    endpoints.slice(0, 10).forEach(endpoint => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="clickable">${endpoint[0]}</td>
            <td>${endpoint[1]}</td>
        `;

        row.cells[0].style.cursor = "pointer";

        row.cells[0].onclick = () => {

            searchBox.value = endpoint[0];

            applyFilters();

        };

        endpointTable.appendChild(row);

    });

}

function renderCurrentPage() {

    const totalPages = Math.max(
        1,
        Math.ceil(filteredLogs.length / PAGE_SIZE)
    );

    if (currentPage > totalPages) {

        currentPage = totalPages;

    }

    const start = (currentPage - 1) * PAGE_SIZE;

    const end = start + PAGE_SIZE;

    const pageLogs = filteredLogs.slice(start, end);

    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;

    prevPageButton.disabled =
        currentPage === 1;

    nextPageButton.disabled =
        currentPage === totalPages;

    loadLogs(pageLogs);
}

function loadLogs(logs) {

    logsTable.innerHTML = "";

    const start =
    filteredLogs.length === 0
        ? 0
        : (currentPage - 1) * PAGE_SIZE + 1;

const end =
    Math.min(
        currentPage * PAGE_SIZE,
        filteredLogs.length
    );

logCounter.textContent =
    `Showing ${start}-${end} of ${filteredLogs.length} requests`;

    logs.forEach((log, index) => {

    const srNo = start + index;

    logsTable.innerHTML += `
        <tr>

            <td>${srNo}</td>

            <td>${log.timestamp}</td>

            <td>${log.ip}</td>

            <td>${log.method}</td>

            <td>${log.status}</td>

            <td>${log.bytes}</td>

            <td>${log.endpoint}</td>

        </tr>
    `;

});
}

searchBox.addEventListener("input", () => {

    applyFilters();

});
function buildFilters(methods, statusCodes) {

    filterBar.innerHTML = "";

    Object.keys(methods).forEach(method => {

        const button = document.createElement("button");

        button.textContent = method;

        button.onclick = () => {

            activeFilter = method;

            applyFilters();

        };

        filterBar.appendChild(button);

    });

    Object.keys(statusCodes).forEach(code => {

        const button = document.createElement("button");

        button.textContent = code;

        button.onclick = () => {

            activeFilter = code;

            applyFilters();

        };

        filterBar.appendChild(button);

    });

    const clearButton = document.createElement("button");

    clearButton.textContent = "Clear Filters";

    clearButton.onclick = () => {

    activeFilter = "";

    searchBox.value = "";

    applyFilters();

};

    filterBar.appendChild(clearButton);

}

function applyFilters() {

    const search = searchBox.value.toLowerCase();

    filteredLogs = currentLogs.filter(log => {

        let matchesSearch;
        // Exact Status Code Search
        if (/^\d{3}$/.test(search)) {
            matchesSearch =
            String(log.status) === search;
}
// Exact HTTP Method Search
        else if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(search.toUpperCase())) {
        matchesSearch =
        log.method === search.toUpperCase();
}
// Global Search
        else {
            matchesSearch =
            Object.values(log)
            .join(" ")
            .toLowerCase()
            .includes(search);
}

        const matchesFilter =
            activeFilter === "" ||
            log.method === activeFilter ||
            String(log.status) === activeFilter;

        return matchesSearch && matchesFilter;

    });

    currentPage = 1;

    renderCurrentPage();

}

function loadHighlights(analysis) {

    const highestIP = analysis.topIPs[0];

    const topEndpoint = analysis.topEndpoints[0];

    const mostCommonStatus =
        Object.entries(analysis.statusCodes)
            .sort((a, b) => b[1] - a[1])[0];

    let errorCount = 0;

    Object.entries(analysis.statusCodes).forEach(([status, count]) => {

        if (Number(status) >= 400) {

            errorCount += count;

        }

    });

    highlights.innerHTML = `
    
        <div class="summaryCard clickableCard" id="highestIPCard">

            <h3>Highest Activity IP</h3>

            <p>${highestIP[0]}</p>

            <small>${highestIP[1]} requests</small>

        </div>

        <div class="summaryCard clickableCard" id="endpointCard">

            <h3>Most Requested Endpoint</h3>

            <p>${topEndpoint[0]}</p>

            <small>${topEndpoint[1]} requests</small>

        </div>

        <div class="summaryCard clickableCard" id="statusCard">

            <h3>Most Common Status</h3>

            <p>${mostCommonStatus[0]}</p>

            <small>${mostCommonStatus[1]} responses</small>

        </div>

        <div class="summaryCard clickableCard" id="errorsCard">

            <h3>HTTP Errors</h3>

            <p>${errorCount}</p>

            <small>Status Code ≥ 400</small>

        </div>

    `;

    document.getElementById("highestIPCard").onclick = () => {

        searchBox.value = highestIP[0];

        applyFilters();

    };

    document.getElementById("endpointCard").onclick = () => {

        searchBox.value = topEndpoint[0];

        applyFilters();

    };

    document.getElementById("statusCard").onclick = () => {

        activeFilter = mostCommonStatus[0];

        applyFilters();

    };

    document.getElementById("errorsCard").onclick = () => {

        const filtered = currentLogs.filter(log => Number(log.status) >= 400);

        searchBox.value = "";

        activeFilter = "";

        loadLogs(filtered);

    };
}
function showToast(message, type = "success") {

    toast.className = "";

    toast.classList.add(type);

    toast.classList.add("show");

    toast.textContent = message;

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

function sortReportsNewestFirst(reports) {

    return [...reports].sort((a, b) => {

        if (a < b) return 1;
        if (a > b) return -1;
        return 0;

    });

}

function populateReportSelector(reports, selectedFilename) {

    reportSelector.innerHTML = "";

    if (!reports || reports.length === 0) {

        const option = document.createElement("option");

        option.value = "";
        option.textContent = "No investigations found";

        reportSelector.appendChild(option);

        return;

    }

    reports.forEach(reportFilename => {

        const option = document.createElement("option");

        option.value = reportFilename;
        option.textContent = reportFilename;

        reportSelector.appendChild(option);

    });

    if (selectedFilename && reports.includes(selectedFilename)) {

        reportSelector.value = selectedFilename;

    } else {

        reportSelector.value = reports[0];

    }

}

async function fetchReportsList() {

    try {

        const response = await fetch("/api/reports");

        const data = await response.json();

        if (!response.ok || !data.success) {

            showToast("Unable to load saved investigations.", "error");

            return [];

        }

        return sortReportsNewestFirst(data.reports || []);

    } catch (error) {

        console.error(error);

        showToast("Unable to connect to the server.", "error");

        return [];

    }

}

async function loadReportByFilename(filename) {

    if (!filename) {
        return;
    }

    try {

        const response = await fetch(`/api/reports/${encodeURIComponent(filename)}`);

        const data = await response.json();

        if (!response.ok || !data.success) {

            showToast(data.message || "Unable to load investigation.", "error");

            return;

        }

        loadDashboard(data);

        lastUploaded.textContent =
            `Loaded Snapshot: ${data.parsedData.filename}`;

        localStorage.setItem("lastReport", filename);

        if (reportSelector.value !== filename) {

            reportSelector.value = filename;

        }

    } catch (error) {

        console.error(error);

        showToast("Unable to connect to the server.", "error");

    }

}

async function refreshReportsDropdown(selectFilename) {

    const reports = await fetchReportsList();

    populateReportSelector(reports, selectFilename);

}

reportSelector.addEventListener("change", () => {

    const selected = reportSelector.value;

    if (selected) {

        loadReportByFilename(selected);

    }

});

function hideEmptyState() {

    emptyState.style.display = "none";

}

function showEmptyDashboard() {

    currentLogs = [];

    activeFilter = "";

    summaryCards.innerHTML = "";

    highlights.innerHTML = "";

    statusTable.innerHTML = "";

    ipTable.innerHTML = "";

    endpointTable.innerHTML = "";

    logsTable.innerHTML = "";

    filterBar.innerHTML = "";

    searchBox.value = "";

    logCounter.textContent = "Showing 0 of 0 requests";

    lastUploaded.textContent = "No snapshot uploaded yet.";

    deleteSnapshotBtn.disabled = true;

    deleteInvestigationBtn.disabled = true;

    emptyState.style.display = "block";

}

deleteSnapshotBtn.addEventListener("click", async () => {

    const filename = reportSelector.value;

    if (!filename) {
        return;
    }

    const confirmed = await showConfirmDialog(
        "Delete Uploaded Snapshot?",
        "This removes the uploaded .log snapshot. The investigation report will remain available. This action cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/api/reports/${encodeURIComponent(filename)}?mode=snapshot`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            showToast(data.message || "Unable to delete snapshot.", "error");

            return;

        }

        showToast(data.message || "Snapshot deleted.", "success");

        await refreshReportsDropdown(filename);

        deleteSnapshotBtn.disabled = true;

    } catch (error) {

        console.error(error);

        showToast("Unable to connect to the server.", "error");

    }

});

deleteInvestigationBtn.addEventListener("click", async () => {

    const filename = reportSelector.value;

    if (!filename) {
        return;
    }

    const confirmed = await showConfirmDialog(
        "Delete Investigation?",
        "This will permanently delete the uploaded snapshot and the investigation report. This action cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/api/reports/${encodeURIComponent(filename)}?mode=investigation`,
            { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            showToast(data.message || "Unable to delete investigation.", "error");

            return;

        }

        showToast(data.message || "Investigation deleted.", "success");

        if (localStorage.getItem("lastReport") === filename) {

            localStorage.removeItem("lastReport");

        }

        const reports = await fetchReportsList();

        if (reports.length === 0) {

            populateReportSelector(reports);

            showEmptyDashboard();

            return;

        }

        const nextFilename = reports[0];

        populateReportSelector(reports, nextFilename);

        await loadReportByFilename(nextFilename);

    } catch (error) {

        console.error(error);

        showToast("Unable to connect to the server.", "error");

    }

});

async function initReportArchive() {

    const reports = await fetchReportsList();

    if (reports.length === 0) {

        populateReportSelector(reports);

        showEmptyDashboard();

        return;

    }

    const storedReport = localStorage.getItem("lastReport");

    const filenameToLoad =
        (storedReport && reports.includes(storedReport))
            ? storedReport
            : reports[0];

    populateReportSelector(reports, filenameToLoad);

    await loadReportByFilename(filenameToLoad);

}

initReportArchive();
prevPageButton.addEventListener("click", () => {

    if (currentPage > 1) {

        currentPage--;

        renderCurrentPage();

    }

});

nextPageButton.addEventListener("click", () => {

    const totalPages =
        Math.ceil(filteredLogs.length / PAGE_SIZE);

    if (currentPage < totalPages) {

        currentPage++;

        renderCurrentPage();
    }
});

jumpButton.addEventListener("click", () => {

    const requestNumber = Number(jumpRequestInput.value);

    if (isNaN(requestNumber)) {

        showToast(
            "Please enter a valid request number.",
            "warning"
        );

        return;

    }

    if (
        requestNumber < 1 ||
        requestNumber > filteredLogs.length
    ) {
        showToast(`Enter a request number between 1 and ${filteredLogs.length}.`,"warning");
        return;
    }
    
    currentPage = Math.ceil(
        requestNumber / PAGE_SIZE
    );
    renderCurrentPage();
});

jumpRequestInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        jumpButton.click();
    }
});