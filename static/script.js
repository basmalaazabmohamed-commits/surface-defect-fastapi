const CLASSES = [
    "crazing",
    "inclusion",
    "patches",
    "pitted_surface",
    "rolled-in_scale",
    "scratches"
];

const form = document.getElementById("uploadForm");
const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");
const clearButton = document.getElementById("clearButton");
const previewImage = document.getElementById("previewImage");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const resultContent = document.getElementById("resultContent");
const probabilityContainer = document.getElementById("probabilityContainer");
const loadingState = document.getElementById("loadingState");
const predictButton = document.getElementById("predictButton");
const alertBox = document.getElementById("alertBox");
const muteAlarmButton = document.getElementById("muteAlarmButton");
const alarmSound = document.getElementById("alarmSound");

let currentPreviewUrl = null;
let isAlarmMuted = false;

function toPercentage(value) {
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${safeValue.toFixed(2)}%`;
}

function prettyClassName(className) {
    return String(className || "")
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getClassBadge(className) {
    const badges = {
        crazing: "CR",
        inclusion: "IN",
        patches: "PA",
        pitted_surface: "PS",
        "rolled-in_scale": "RS",
        scratches: "SC"
    };
    return badges[className] || "DF";
}

function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
}

function playAlarm() {
    if (isAlarmMuted) {
        return;
    }
    alarmSound.currentTime = 0;
    alarmSound.play().catch((error) => {
        console.log("Audio play blocked:", error);
    });
}

function renderProbabilityBars(predictedClass, allPredictions = {}) {
    probabilityContainer.innerHTML = "";

    const sortedRows = CLASSES.map((className) => ({
        className,
        value: Number(allPredictions[className] ?? 0)
    })).sort((a, b) => b.value - a.value);

    sortedRows.forEach(({ className, value }) => {
        const row = document.createElement("div");
        row.className = "prob-row";
        if (className === predictedClass) {
            row.classList.add("predicted");
        }

        row.innerHTML = `
            <div class="prob-top">
                <span class="prob-label">
                    <span class="class-badge">${getClassBadge(className)}</span>
                    ${prettyClassName(className)}
                </span>
                <strong class="prob-value">${toPercentage(value)}</strong>
            </div>
            <div class="prob-track">
                <div class="prob-fill" data-target-width="${Math.max(0, Math.min(value, 100))}"></div>
            </div>
        `;

        probabilityContainer.appendChild(row);
    });

    requestAnimationFrame(() => {
        const fills = probabilityContainer.querySelectorAll(".prob-fill");
        fills.forEach((fill) => {
            const width = Number(fill.getAttribute("data-target-width"));
            fill.style.width = `${width}%`;
        });
    });
}

function renderResult(predictedClass, confidence) {
    resultContent.innerHTML = `
        <div class="result-grid">
            <div class="result-chip predicted">
                <div class="label">Predicted Class</div>
                <div class="value">${prettyClassName(predictedClass)}</div>
            </div>
            <div class="result-chip confidence">
                <div class="label">Confidence</div>
                <div class="value">${toPercentage(confidence)}</div>
            </div>
        </div>
    `;
    resultContent.classList.remove("show");
    requestAnimationFrame(() => resultContent.classList.add("show"));
}

function clearPreview() {
    imageInput.value = "";
    fileName.textContent = "No file selected";
    previewImage.classList.remove("visible");
    previewImage.removeAttribute("src");
    previewPlaceholder.classList.remove("hidden");
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
    }
}

function handleFileSelection(file) {
    if (!file) {
        clearPreview();
        return;
    }

    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
    }

    currentPreviewUrl = URL.createObjectURL(file);
    previewImage.src = currentPreviewUrl;
    previewImage.classList.add("visible");
    previewPlaceholder.classList.add("hidden");
    fileName.textContent = file.name;
}

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    handleFileSelection(file);
});

dropZone.addEventListener("click", () => imageInput.click());
dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
        return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;
    handleFileSelection(file);
});

clearButton.addEventListener("click", () => {
    clearPreview();
    stopAlarm();
    alertBox.classList.add("hidden");
    alertBox.classList.remove("active");
    resultContent.innerHTML = '<p class="muted">Upload an image and click <strong>Predict Defect</strong> to view classification results.</p>';
    resultContent.classList.add("show");
    renderProbabilityBars("", {});
});

muteAlarmButton.addEventListener("click", () => {
    isAlarmMuted = !isAlarmMuted;
    stopAlarm();
    muteAlarmButton.textContent = isAlarmMuted ? "Unmute Alarm" : "Mute Alarm";
    muteAlarmButton.classList.toggle("muted", isAlarmMuted);
});

window.addEventListener("scroll", () => {
    if (window.scrollY > 80) {
        document.body.classList.add("scrolled");
    } else {
        document.body.classList.remove("scrolled");
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = imageInput.files[0];
    if (!file) {
        resultContent.innerHTML = '<p class="muted">Please select an image file first.</p>';
        return;
    }

    alertBox.classList.add("hidden");
    alertBox.classList.remove("active");
    stopAlarm();
    loadingState.classList.remove("hidden");
    predictButton.disabled = true;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/predict", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Prediction failed with status ${response.status}`);
        }

        const data = await response.json();
        renderResult(data.predicted_class, data.confidence);
        renderProbabilityBars(data.predicted_class, data.all_predictions || {});

        if (data.predicted_class) {
            alertBox.classList.remove("hidden");
            alertBox.classList.add("active");
            playAlarm();
        }
    } catch (error) {
        resultContent.innerHTML = `<p class="muted">Prediction failed. ${error.message}</p>`;
        resultContent.classList.add("show");
        renderProbabilityBars("", {});
        alertBox.classList.add("hidden");
        alertBox.classList.remove("active");
    } finally {
        loadingState.classList.add("hidden");
        predictButton.disabled = false;
    }
});

renderProbabilityBars("", {});
resultContent.classList.add("show");
