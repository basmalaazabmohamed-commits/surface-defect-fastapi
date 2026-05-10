# NeuroSteel AI - Surface Defect Detection System

<p align="center">
  <img src="static/screenshots/hero.png" alt="NeuroSteel AI" width="800"/>
</p>

<p align="center">
  <strong>Premium AI-Powered Industrial Surface Defect Classification</strong><br>
  Built with FastAPI, TensorFlow/EfficientNetB0, and Modern Web Technologies
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api">API</a> •
  <a href="#model">Model</a>
</p>

---

## 🚀 Features

### AI/ML Capabilities
- **Deep Learning Classification**: EfficientNet-B0 architecture for accurate defect detection
- **6 Defect Categories**: Comprehensive coverage of common steel surface defects
- **CLAHE Enhancement**: Contrast Limited Adaptive Histogram Equalization for improved image preprocessing
- **Real-time Inference**: Fast prediction with optimized TensorFlow model
- **Confidence Scoring**: Probability distribution across all defect classes

### Premium Frontend
- **Futuristic UI/UX**: Dark theme with neon glows, glassmorphism, and animated backgrounds
- **Interactive Upload**: Drag-and-drop with visual feedback and image preview
- **Real-time Results**: Animated probability bars and classification cards
- **Sound Effects**: Audio feedback for defect detection and success states
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Smooth Animations**: Floating particles, gradient orbs, scroll-triggered reveals

### Technical Features
- **FastAPI Backend**: High-performance async Python web framework
- **Static File Serving**: Optimized CSS/JS delivery
- **Jinja2 Templating**: Server-side rendered HTML
- **RESTful API**: Clean `/predict` endpoint for integration
- **Error Handling**: Comprehensive exception management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Browser    │  │   Upload     │  │   Results Display    │   │
│  │   (HTML/CSS) │  │   (Drag/Drop)│  │   (Charts/Cards)     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          └─────────────────┼─────────────────────┘
                            │ HTTP/POST
┌───────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI SERVER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes:                                                 │   │
│  │    GET  /      → Render index.html                      │   │
│  │    POST /predict → Process image, return classification │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                  PREPROCESSING PIPELINE                          │
│                                                                  │
│  1. Image Upload → PIL.Image.open()                              │
│  2. Resize       → (224, 224) EfficientNet input size           │
│  3. CLAHE        → Contrast enhancement (clipLimit=2.0)           │
│  4. Normalization→ preprocess_input()                           │
│  5. Array Format → numpy.expand_dims()                          │
└───────────────────────────┬───────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                   TENSORFLOW MODEL                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Architecture: EfficientNet-B0 (pre-trained on ImageNet) │   │
│  │  Input Shape:  (1, 224, 224, 3)                          │   │
│  │  Output Shape: (1, 6) - 6 defect classes               │   │
│  │  Activation:   Softmax                                   │   │
│  └────────────────────────┬────────────────────────────────┘   │
└───────────────────────────┼───────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                    PREDICTION OUTPUT                             │
│                                                                  │
│  • predicted_class: String (e.g., "crazing")                    │
│  • confidence:      Float (0-100%)                               │
│  • all_predictions: Object with class probabilities             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data & Classes

### Defect Categories

| Class | Description | Badge | Visual Characteristics |
|-------|-------------|-------|----------------------|
| **Crazing** | Network of fine cracks | CR | Irregular crack patterns like spider webs |
| **Inclusion** | Non-metallic particles | IN | Dark spots or foreign material inclusions |
| **Patches** | Surface discoloration | PA | Irregular colored patches or stains |
| **Pitted Surface** | Small cavities/holes | PS | Dotted, pitted texture |
| **Rolled-in Scale** | Oxide layer defects | RS | Dark lines, scale marks from rolling |
| **Scratches** | Linear surface damage | SC | Longitudinal or curved scratch marks |

### Dataset Information
- **Source**: NEU Surface Defect Database (North Eastern University, China)
- **Total Images**: 1,800 grayscale images
- **Resolution**: 200x200 pixels
- **Format**: Grayscale PNG/JPG
- **Classes**: 6 balanced categories (300 images each)

### Preprocessing Pipeline

```python
def preprocess_image(image_bytes):
    # 1. Load image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # 2. Resize to model input size
    image = image.resize((224, 224))
    
    # 3. Convert to numpy array
    img_array = np.array(image)
    
    # 4. Apply CLAHE for contrast enhancement
    gray = cv2.cvtColor(img_array.astype("uint8"), cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
    
    # 5. Normalize for EfficientNet
    img_array = enhanced_rgb.astype(np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    
    return img_array
```

---

## 🧠 Model Details

### Architecture: EfficientNet-B0
- **Base Model**: EfficientNet-B0 (pre-trained on ImageNet)
- **Modifications**: Custom top layers for 6-class classification
- **Input**: 224x224 RGB images
- **Output**: 6-class softmax probabilities
- **Parameters**: ~5.3M (EfficientNet-B0 base)

### Why EfficientNet?
- **Compound Scaling**: Balances depth, width, and resolution
- **Mobile-Friendly**: Efficient for deployment
- **High Accuracy**: State-of-the-art on ImageNet
- **Fast Inference**: Optimized for CPU/GPU execution

### Training Configuration
```python
Optimizer: Adam (lr=0.001)
Loss: Categorical Crossentropy
Metrics: Accuracy, Precision, Recall
Epochs: 50 with early stopping
Batch Size: 32
Validation Split: 20%
Data Augmentation: Rotation, Flip, Zoom
```

### Performance Metrics
- **Accuracy**: ~95% on validation set
- **Precision**: ~94% average across classes
- **Recall**: ~93% average across classes
- **F1-Score**: ~93.5% average

---

## ⚙️ Installation

### Prerequisites
- Python 3.8+
- pip package manager
- Git (optional)

### Step 1: Clone Repository
```bash
git clone https://github.com/basmalaazabmohamed-commits/surface-defect-fastapi.git
cd surface-defect-fastapi
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

**Required Packages:**
```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
jinja2==3.1.2
tensorflow==2.15.0
numpy==1.24.3
pillow==10.1.0
opencv-python==4.8.1.78
scikit-image==0.22.0
```

### Step 4: Download Model (if not included)
The model file `surface_defect_model.keras` should be in the root directory.

If missing, download from:
```bash
# Option 1: Copy from model-files directory
cp model-files/surface_defect_model.keras ./

# Option 2: Download from releases
wget https://github.com/basmalaazabmohamed-commits/surface-defect-fastapi/releases/download/v1.0.0/surface_defect_model.keras
```

### Step 5: Verify Installation
```bash
python -c "import tensorflow as tf; print(tf.__version__)"
python -c "import cv2; print(cv2.__version__)"
```

---

## 🚀 Usage

### Start the Server
```bash
# Standard mode
python app.py

# Or using uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
```

The server will start at `http://localhost:3000`

### Access the Web Interface
Open your browser and navigate to:
```
http://localhost:3000
```

### Upload and Classify
1. **Drag & Drop** an image onto the upload zone
2. **Click** the upload area to browse files
3. **Supported formats**: JPG, PNG, BMP, TIFF
4. **Click** "Analyze Surface" to process
5. **View** results with confidence scores and probability bars

### API Usage

#### Endpoint: POST /predict

**Request:**
```bash
curl -X POST "http://localhost:3000/predict" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_image.jpg"
```

**Response:**
```json
{
  "predicted_class": "crazing",
  "confidence": 94.56,
  "all_predictions": {
    "crazing": 94.56,
    "inclusion": 2.31,
    "patches": 1.24,
    "pitted_surface": 0.89,
    "rolled-in_scale": 0.67,
    "scratches": 0.33
  }
}
```

#### Python Client Example
```python
import requests

def predict_defect(image_path):
    url = "http://localhost:3000/predict"
    
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Predicted: {result['predicted_class']}")
        print(f"Confidence: {result['confidence']}%")
        return result
    else:
        print(f"Error: {response.status_code}")
        return None

# Usage
result = predict_defect("steel_surface.jpg")
```

#### JavaScript Client Example
```javascript
async function classifyImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("http://localhost:3000/predict", {
    method: "POST",
    body: formData
  });
  
  const result = await response.json();
  console.log("Prediction:", result.predicted_class);
  console.log("Confidence:", result.confidence + "%");
  return result;
}
```

---

## 📁 Project Structure

```
surface-defect-fastapi/
├── app.py                    # FastAPI application (backend)
├── class_names.json          # Defect class labels
├── surface_defect_model.keras # Trained TensorFlow model
├── requirements.txt          # Python dependencies
├── README.md                 # This documentation
├── .gitignore               # Git ignore rules
│
├── static/                  # Static assets
│   ├── style.css           # Premium futuristic styles
│   ├── script.js           # Frontend interactions
│   ├── alarm.mp3           # Defect alert sound
│   └── success.mp3         # Success sound
│
├── templates/              # Jinja2 templates
│   └── index.html          # Main application page
│
└── sample_images/          # Test images (optional)
    ├── crazing_1.jpg
    ├── inclusion_1.jpg
    ├── patches_1.jpg
    ├── pitted_surface_1.jpg
    ├── rolled-in_scale_1.jpg
    └── scratches_1.jpg
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Set custom port
PORT=3000

# Optional: Disable TensorFlow warnings
TF_CPP_MIN_LOG_LEVEL=2
TF_ENABLE_ONEDNN_OPTS=0
```

### Model Configuration
Edit in `app.py`:
```python
MODEL_PATH = "surface_defect_model.keras"  # Model file path
CLASSES_PATH = "class_names.json"           # Class labels
IMG_SIZE = 224                               # Input image size
```

---

## 🎨 Frontend Technologies

### CSS Features
- **CSS Variables**: Dynamic theming with energy colors
- **Glassmorphism**: `backdrop-filter: blur()` effects
- **Animations**: Keyframes for floating, pulsing, scanning
- **Responsive**: Media queries for all screen sizes
- **Gradients**: Animated gradient backgrounds

### JavaScript Features
- **Vanilla JS**: No framework dependencies
- **Fetch API**: Async/await for server communication
- **Canvas API**: Image preview and manipulation
- **Web Audio**: Sound effects for alerts
- **Intersection Observer**: Scroll-triggered animations

### Key Libraries (Frontend)
- **Google Fonts**: Orbitron, Exo 2, Rajdhani
- **Font Awesome**: Icons (optional)
- **No Build Step**: Direct browser execution

---

## 🐛 Troubleshooting

### Issue: Model file not found
**Error**: `FileNotFoundError: surface_defect_model.keras`

**Solution**:
```bash
# Copy from model-files directory
cp model-files/surface_defect_model.keras ./

# Or download from releases
```

### Issue: Port already in use
**Error**: `[Errno 10048] address already in use`

**Solution**:
```bash
# Use different port
uvicorn app:app --port 8080

# Or kill existing process
# Windows: taskkill /F /IM python.exe
# Linux: killall python
```

### Issue: TensorFlow import error
**Error**: `ModuleNotFoundError: No module named 'tensorflow'`

**Solution**:
```bash
pip install tensorflow==2.15.0

# For CPU-only (lighter install)
pip install tensorflow-cpu==2.15.0
```

### Issue: CV2 import error
**Error**: `ModuleNotFoundError: No module named 'cv2'`

**Solution**:
```bash
pip install opencv-python==4.8.1.78
```

---

## 📸 Screenshots

<p align="center">
  <img src="static/screenshots/upload.png" alt="Upload Interface" width="400"/>
  <img src="static/screenshots/results.png" alt="Results Display" width="400"/>
</p>

---

## 📝 Changelog

### v1.0.0 (2024-01-15)
- ✅ Initial release
- ✅ FastAPI backend with EfficientNet-B0 model
- ✅ Premium futuristic UI with glassmorphism
- ✅ Drag-and-drop image upload
- ✅ Real-time prediction with probability bars
- ✅ Sound effects and animations
- ✅ Responsive design

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Format code
black app.py
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NEU Surface Defect Database** for the dataset
- **TensorFlow Team** for the EfficientNet implementation
- **FastAPI** for the excellent web framework
- **OpenCV** for image processing capabilities

---

## 📞 Contact

**Basmala Azab Mohamed & Yousef Amr Elbish**
- GitHub: [@basmalaazabmohamed-commits](https://github.com/basmalaazabmohamed-commits) / [@elbish1](https://github.com/elbish1)
- Project: [surface-defect-fastapi](https://github.com/basmalaazabmohamed-commits/surface-defect-fastapi)

---

<p align="center">
  Made with ❤️ and ☕ by Basmala Azab Mohamed & Yousef Amr Elbish
</p>
