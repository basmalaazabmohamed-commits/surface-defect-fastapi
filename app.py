from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

import tensorflow as tf
import numpy as np
from PIL import Image
import json
import io
import cv2

from tensorflow.keras.applications.efficientnet import preprocess_input

app = FastAPI(title="Surface Defect Classification API")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

MODEL_PATH = "surface_defect_model.keras"
CLASSES_PATH = "class_names.json"

IMG_SIZE = 224

model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASSES_PATH, "r") as f:
    class_names = json.load(f)


def apply_clahe_rgb(image):
    gray = cv2.cvtColor(image.astype("uint8"), cv2.COLOR_RGB2GRAY)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

    enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)

    return enhanced_rgb


def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    image = image.resize((IMG_SIZE, IMG_SIZE))

    img_array = np.array(image)

    img_array = apply_clahe_rgb(img_array)

    img_array = img_array.astype(np.float32)

    img_array = np.expand_dims(img_array, axis=0)

    img_array = preprocess_input(img_array)

    return img_array


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        img_array = preprocess_image(image_bytes)

        predictions = model.predict(img_array, verbose=0)

        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        predicted_class = class_names[predicted_index]

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence * 100, 2),
            "all_predictions": {
                class_names[i]: round(float(predictions[0][i]) * 100, 2)
                for i in range(len(class_names))
            }
        }

    except Exception as e:
        return {
            "error": str(e)
        }