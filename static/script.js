/**
 * NeuroSteel AI - Surface Defect Detection System
 * Enhanced JavaScript with Premium UI Interactions
 */

// Defect Classes
const CLASSES = [
    "crazing",
    "inclusion",
    "patches",
    "pitted_surface",
    "rolled-in_scale",
    "scratches"
];

const CLASS_BADGES = {
    crazing: "CR",
    inclusion: "IN",
    patches: "PA",
    pitted_surface: "PS",
    "rolled-in_scale": "RS",
    scratches: "SC"
};

// State
let currentPreviewUrl = null;
let isAlarmMuted = false;
let isProcessing = false;

// DOM Elements
const form = document.getElementById("uploadForm");
const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");
const clearButton = document.getElementById("clearButton");
const previewImage = document.getElementById("previewImage");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const previewFrame = document.querySelector(".preview-frame");
const resultContent = document.getElementById("resultContent");
const probabilityContainer = document.getElementById("probabilityContainer");
const loadingState = document.getElementById("loadingState");
const predictButton = document.getElementById("predictButton");
const alertBox = document.getElementById("alertBox");
const muteAlarmButton = document.getElementById("muteAlarmButton");
const muteIcon = document.getElementById("muteIcon");
const alarmSound = document.getElementById("alarmSound");
const successSound = document.getElementById("successSound");

// Utility Functions
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
    return CLASS_BADGES[className] || "DF";
}

// Sound Functions
function playAlarm() {
    if (!isAlarmMuted && alarmSound) {
        alarmSound.currentTime = 0;
        alarmSound.play().catch((error) => {
            console.log("Audio play blocked:", error);
        });
    }
}

function stopAlarm() {
    if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
    }
}

function playSuccess() {
    if (successSound) {
        successSound.currentTime = 0;
        successSound.play().catch((error) => {
            console.log("Audio play blocked:", error);
        });
    }
}

// Particle Animation
function createParticles() {
    const container = document.getElementById("particles");
    if (!container) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        
        const size = 2 + Math.random() * 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        container.appendChild(particle);
    }
}

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll(".stat-number");
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute("data-count"));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animate-in");
            }
        });
    }, observerOptions);
    
    document.querySelectorAll(".workflow-step, .info-card, .class-card, .stack-item").forEach(el => {
        observer.observe(el);
    });
}

// Navigation Scroll Effect
function initNavScroll() {
    const nav = document.querySelector(".nav-bar");
    let lastScroll = 0;
    
    window.addEventListener("scroll", () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            nav.style.background = "rgba(3, 5, 8, 0.95)";
            nav.style.boxShadow = "0 4px 30px rgba(0, 245, 255, 0.1)";
        } else {
            nav.style.background = "rgba(3, 5, 8, 0.8)";
            nav.style.boxShadow = "none";
        }
        
        lastScroll = currentScroll;
    });
}

// Smooth Scroll for Navigation Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
                
                // Update active nav link
                document.querySelectorAll(".nav-link").forEach(link => {
                    link.classList.remove("active");
                });
                this.classList.add("active");
            }
        });
    });
}

// Drag and Drop Handlers
function initDragAndDrop() {
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });
    
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
            handleFileSelection(file);
        }
    });
    
    dropZone.addEventListener("click", () => {
        imageInput.click();
    });
}

// File Selection Handler
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
    previewFrame.classList.add("has-image");
    fileName.textContent = file.name;
    fileName.style.color = "var(--energy-cyan)";
}

// Clear Preview
function clearPreview() {
    imageInput.value = "";
    fileName.textContent = "No file selected";
    fileName.style.color = "var(--text-muted)";
    previewImage.classList.remove("visible");
    previewFrame.classList.remove("has-image");
    previewPlaceholder.classList.remove("hidden");
    
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
    }
    
    // Reset results
    resultContent.innerHTML = `
        <div class="result-waiting">
            <div class="waiting-icon">
                <svg viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                    <text x="32" y="37" text-anchor="middle" fill="currentColor" font-size="20">?</text>
                </svg>
            </div>
            <p>Upload an image and click <strong>Analyze Defect</strong></p>
            <span>to view classification results</span>
        </div>
    `;
    
    probabilityContainer.innerHTML = "";
    alertBox.classList.add("hidden");
    stopAlarm();
}

// Render Probability Bars
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
                <div class="prob-label">
                    <span class="class-badge">${getClassBadge(className)}</span>
                    <span class="prob-class-name">${prettyClassName(className)}</span>
                </div>
                <span class="prob-value">${toPercentage(value)}</span>
            </div>
            <div class="prob-track">
                <div class="prob-fill" data-target-width="${Math.max(0, Math.min(value, 100))}"></div>
            </div>
        `;
        
        probabilityContainer.appendChild(row);
    });
    
    // Animate bars
    setTimeout(() => {
        const fills = probabilityContainer.querySelectorAll(".prob-fill");
        fills.forEach((fill) => {
            const width = fill.getAttribute("data-target-width");
            fill.style.width = `${width}%`;
        });
    }, 100);
}

// Render Result
function renderResult(predictedClass, confidence) {
    const isDefect = predictedClass && predictedClass !== "";
    
    resultContent.innerHTML = `
        <div class="result-grid">
            <div class="result-chip ${isDefect ? 'predicted' : ''}">
                <div class="label">Predicted Class</div>
                <div class="value">${prettyClassName(predictedClass) || "None"}</div>
            </div>
            <div class="result-chip confidence">
                <div class="label">Confidence</div>
                <div class="value">${toPercentage(confidence)}</div>
            </div>
        </div>
    `;
    
    // Add animation
    resultContent.style.opacity = "0";
    resultContent.style.transform = "translateY(10px)";
    setTimeout(() => {
        resultContent.style.transition = "all 0.5s ease";
        resultContent.style.opacity = "1";
        resultContent.style.transform = "translateY(0)";
    }, 50);
}

// Store last result for comparison
let lastResult = null;

// Form Submit Handler
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const file = imageInput.files[0];
    if (!file) {
        resultContent.innerHTML = `
            <div class="result-waiting">
                <p style="color: var(--danger);">Please select an image file first</p>
            </div>
        `;
        return;
    }
    
    // Reset state
    alertBox.classList.add("hidden");
    stopAlarm();
    
    // Show loading
    loadingState.classList.remove("hidden");
    predictButton.disabled = true;
    isProcessing = true;
    
    // Clear previous results to ensure fresh display
    resultContent.innerHTML = "";
    probabilityContainer.innerHTML = "";
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    try {
        const response = await fetch(`/predict?_t=${timestamp}`, {
            method: "POST",
            body: formData,
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Prediction failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Prediction result:", data);
        
        // Check for error
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Store result
        lastResult = data;
        
        // Render results
        renderResult(data.predicted_class, data.confidence);
        renderProbabilityBars(data.predicted_class, data.all_predictions || {});
        
        // Show alert and play sound if defect detected
        if (data.predicted_class) {
            alertBox.classList.remove("hidden");
            playAlarm();
        } else {
            playSuccess();
        }
        
    } catch (error) {
        console.error("Prediction error:", error);
        resultContent.innerHTML = `
            <div class="result-waiting">
                <p style="color: var(--danger);">Prediction failed</p>
                <span>${error.message}</span>
            </div>
        `;
        probabilityContainer.innerHTML = "";
    } finally {
        loadingState.classList.add("hidden");
        predictButton.disabled = false;
        isProcessing = false;
    }
});

// Clear Button Handler
clearButton.addEventListener("click", () => {
    clearPreview();
    stopAlarm();
});

// Image Input Handler
imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    handleFileSelection(file);
});

// Mute Button Handler
muteAlarmButton.addEventListener("click", () => {
    isAlarmMuted = !isAlarmMuted;
    stopAlarm();
    
    muteIcon.textContent = isAlarmMuted ? "🔇" : "🔊";
    muteAlarmButton.style.background = isAlarmMuted 
        ? "rgba(255, 51, 102, 0.3)" 
        : "rgba(255, 255, 255, 0.1)";
});

// Active Navigation Update on Scroll
function updateActiveNav() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");
    
    let current = "";
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute("id");
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
}

window.addEventListener("scroll", updateActiveNav);

// Initialize
function init() {
    createParticles();
    animateCounters();
    initScrollAnimations();
    initNavScroll();
    initSmoothScroll();
    initDragAndDrop();
    
    // Add animation styles
    const style = document.createElement("style");
    style.textContent = `
        .animate-in {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .workflow-step {
            opacity: 0;
        }
        
        .workflow-step.animate-in {
            opacity: 1;
        }
        
        .info-card, .class-card, .stack-item {
            opacity: 0;
        }
        
        .info-card.animate-in,
        .class-card.animate-in,
        .stack-item.animate-in {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Run initialization when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
    module.exports = { CLASSES, CLASS_BADGES };
}
