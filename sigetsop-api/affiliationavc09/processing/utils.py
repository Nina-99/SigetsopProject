#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
import os
from PIL import Image
import cv2
import numpy as np
from pdf2image import convert_from_path


def pdf_to_images(pdf_path, dpi=300):
    ext = os.path.splitext(pdf_path)[1].lower()
    if ext == ".pdf":
        return convert_from_path(pdf_path, dpi=dpi)
    else:
        return [Image.open(pdf_path).convert("RGB")]


def crop_zone(img, zone):
    h, w = img.shape[:2]
    # Si la coordenada es <= 1, se asume que es un porcentaje del tamaño total
    x1 = int(zone[0] * w) if zone[0] <= 1 and zone[0] != 0 else int(zone[0])
    y1 = int(zone[1] * h) if zone[1] <= 1 and zone[1] != 0 else int(zone[1])
    x2 = int(zone[2] * w) if zone[2] <= 1 and zone[2] != 0 else int(zone[2])
    y2 = int(zone[3] * h) if zone[3] <= 1 and zone[3] != 0 else int(zone[3])

    # Asegura que las coordenadas no superen los límites
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)

    return img[y1:y2, x1:x2]


def find_initial_points(pil_img):
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    mask = remove_signature(gray)

    blur = cv2.GaussianBlur(mask, (5, 5), 0)
    edged = cv2.Canny(blur, 10, 150)
    kernel = np.ones((3, 3))
    dilatation = cv2.dilate(edged, kernel, iterations=1)
    cnts, _ = cv2.findContours(dilatation, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    screenCnt = None
    max_area = 0

    for c in cnts:
        area = cv2.contourArea(c)
        if area > 1000:
            perimetro = cv2.arcLength(c, True)
            aprox = cv2.approxPolyDP(c, 0.02 * perimetro, True)

            if area > max_area and len(aprox) == 4:
                max_area = area
                screenCnt = aprox
    height, width = img.shape[:2]
    img_area = width * height

    if screenCnt is None:
        print("Error: No se pudo encontrar un contorno de 4 puntos (documento).")
        return None

    area_ratio = max_area / img_area

    if area_ratio < 0.3:
        print(
            f"El cuadrado detectado es muy pequeño ({area_ratio * 100:.2f}% del área total)."
        )
        margin_x = int(width * 0.1)
        margin_y = int(height * 0.1)

        # NOTE: Define un cuadrado casi del tamaño de la imagen, con un pequeño margen
        pts = np.array(
            [
                [margin_x, margin_y],
                [width - margin_x, margin_y],
                [width - margin_x, height - margin_y],
                [margin_x, height - margin_y],
            ],
            dtype="float32",
        )
    else:
        pts = order_points(screenCnt.reshape(4, 2))

    return pts


def apply_perspective_transform(pil_img, pts, target_width=1000, target_height=600):
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # Calcular las dimensiones de la imagen corregida
    widthA = np.sqrt(((pts[2][0] - pts[3][0]) ** 2) + ((pts[2][1] - pts[3][1]) ** 2))
    widthB = np.sqrt(((pts[1][0] - pts[0][0]) ** 2) + ((pts[1][1] - pts[0][1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.sqrt(((pts[1][0] - pts[2][0]) ** 2) + ((pts[1][1] - pts[2][1]) ** 2))
    heightB = np.sqrt(((pts[0][0] - pts[3][0]) ** 2) + ((pts[0][1] - pts[3][1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    # Puntos de destino (rectángulo)
    dst = np.array(
        [
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1],
        ],
        dtype="float32",
    )

    M = cv2.getPerspectiveTransform(pts, dst)
    warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
    warped = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)

    # Utiliza la función importada desde utils.py
    warped = resize_image(warped, target_width, target_height)

    return warped


def order_points(pts):
    # Inicializar el arreglo de 4 puntos ordenados: TL, TR, BR, BL
    rect = np.zeros((4, 2), dtype="float32")

    # Suma de coordenadas (min para TL, max para BR)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Superior Izquierda
    rect[2] = pts[np.argmax(s)]  # Inferior Derecha

    # Diferencia de coordenadas (min para TR, max para BL)
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Superior Derecha
    rect[3] = pts[np.argmax(diff)]  # Inferior Izquierda

    return rect


def resize_image(image_path, target_width, target_height):
    img = image_path
    if img is None:
        print(f"Error: No se pudo cargar la imagen en {image_path}")
        return None

    # Redimensionar la imagen
    # cv2.INTER_AREA es bueno para reducir, cv2.INTER_LINEAR para ampliar
    resized_img = cv2.resize(
        img, (target_width, target_height), interpolation=cv2.INTER_LINEAR
    )

    return resized_img


def remove_signature(img):
    # Umbral adaptativo (Gaussian C) invertido para resaltar texto
    th = cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 10
    )

    # morfología para unir trazos finos
    kernel = np.ones((2, 2), np.uint8)

    erosion = cv2.erode(th, kernel, iterations=1)
    # La dilatación revierte el daño de la erosión en las áreas gruesas, recuperando un poco el sello/firma.
    limpieza = cv2.dilate(erosion, kernel, iterations=1)

    # Después de este paso, 'limpieza' debería contener solo las firmas y sellos como manchas blancas.

    # 4. Invertir la máscara y Aplicar (Eliminar)
    # Invertimos 'limpieza' para crear una MÁSCARA donde las firmas/sellos sean NEGRO (0) y todo lo demás sea BLANCO (255).
    mask = cv2.bitwise_not(limpieza)

    return mask


def correct_img(pil_img, points, image_size, display_size, rotation=0):
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # 🔹 1. Rotar la imagen físicamente para que coincida con lo que el usuario ve
    if rotation == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == 180:
        img = cv2.rotate(img, cv2.ROTATE_180)
    elif rotation == 270:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

    # Dimensiones de la imagen ya rotada
    h_orig, w_orig = img.shape[:2]

    # 🔹 2. Escalar los puntos basados en el canvas visual (display_size)
    # display_size en el frontend ya contempla la rotación (intercambia W y H)
    scale_x = w_orig / display_size["width"]
    scale_y = h_orig / display_size["height"]

    if isinstance(points[0], dict):
        pts = np.array(
            [[p["x"] * scale_x, p["y"] * scale_y] for p in points], dtype="float32"
        )
    else:
        pts = np.array(
            [[p[0] * scale_x, p[1] * scale_y] for p in points], dtype="float32"
        )

    # Ordenar puntos: Superior Izquierda, Superior Derecha, Inferior Derecha, Inferior Izquierda
    pts = order_points(pts)

    # 🔹 3. Calcular dimensiones reales del recorte (sin aplastar)
    widthA = np.sqrt(((pts[2][0] - pts[3][0]) ** 2) + ((pts[2][1] - pts[3][1]) ** 2))
    widthB = np.sqrt(((pts[1][0] - pts[0][0]) ** 2) + ((pts[1][1] - pts[0][1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.sqrt(((pts[1][0] - pts[2][0]) ** 2) + ((pts[1][1] - pts[2][1]) ** 2))
    heightB = np.sqrt(((pts[0][0] - pts[3][0]) ** 2) + ((pts[0][1] - pts[3][1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array(
        [
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1],
        ],
        dtype="float32",
    )

    # 🔹 4. Transformación de Perspectiva
    M = cv2.getPerspectiveTransform(pts, dst)
    warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))

    # IMPORTANTE: Devolvemos en color y sin resize forzado para que el OCR sea preciso.
    return warped
