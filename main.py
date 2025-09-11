from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import cv2
import numpy as np
from PIL import Image

# =============================================
# CONFIGURACIÓN INICIAL PARA RENDER
# =============================================
app = Flask(__name__)

# Configuración para Render
app.config.update(
    UPLOAD_FOLDER='static/uploads',
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB
    SECRET_KEY=os.environ.get('SECRET_KEY', 'render-default-secret-key-123'),
)

# Asegurar que la carpeta de uploads existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# =============================================
# ANÁLISIS REAL DE IMÁGENES CON OPENCV
# =============================================
def analyze_house_image_real(image_path):
    """Analiza imágenes de viviendas usando procesamiento de imágenes real con OpenCV"""
    try:
        # Cargar imagen
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "No se pudo cargar la imagen"}
        
        # Convertir a escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        height, width = img.shape[:2]
        
        # 1. Análisis de calidad de imagen
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        brightness = np.mean(gray)
        
        # 2. Detectar bordes y contornos
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 3. Filtrar contornos significativos
        significant_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 500]
        
        # 4. Detectar formas geométricas
        structural_elements = []
        for contour in significant_contours:
            perimeter = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
            
            if len(approx) == 4:
                # Cuadrado/rectángulo (posible ventana, puerta)
                structural_elements.append({
                    "type": "rectangular_structure",
                    "size": cv2.contourArea(contour)
                })
            elif len(approx) >= 5:
                # Forma compleja
                structural_elements.append({
                    "type": "complex_structure", 
                    "size": cv2.contourArea(contour)
                })
        
        # 5. Determinar nivel de riesgo basado en análisis real
        issues = []
        recommendations = []
        
        # Análisis de calidad de imagen
        if laplacian_var < 50:
            issues.append("Imagen de baja calidad o borrosa")
            recommendations.append("Tome una foto más nítida con buena iluminación")
        
        if brightness < 50:
            issues.append("Imagen demasiado oscura")
            recommendations.append("Tome la foto con mejor iluminación natural")
        
        # Análisis estructural
        rect_structures = [s for s in structural_elements if s["type"] == "rectangular_structure"]
        
        if len(rect_structures) < 2:
            issues.append("Pocos elementos estructurales visibles")
            recommendations.append("Capture toda la fachada del inmueble para mejor análisis")
        
        # Calcular riesgo basado en los factores
        risk_score = 0
        if laplacian_var < 50: risk_score += 1
        if brightness < 50: risk_score += 1
        if len(rect_structures) < 2: risk_score += 2
        
        if risk_score >= 3:
            risk_level = "Alto"
        elif risk_score == 2:
            risk_level = "Moderado-Alto"
        elif risk_score == 1:
            risk_level = "Moderado"
        else:
            risk_level = "Bajo"
        
        # Si no hay issues específicos pero la imagen es de buena calidad
        if not issues and len(rect_structures) >= 2:
            issues.append("Estructura aparentemente estable")
            recommendations.append("Mantenga revisiones periódicas de su propiedad")
        
        # Datos técnicos para transparencia
        technical_data = {
            'image_resolution': f"{width}x{height}",
            'image_quality_score': int(laplacian_var),
            'brightness_level': int(brightness),
            'edges_detected': len(significant_contours),
            'structural_elements': len(structural_elements),
            'rectangular_structures': len(rect_structures)
        }
        
        return {
            'status': 'success',
            'analysis_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'risk_level': risk_level,
            'risk_score': risk_score,
            'issues_detected': issues,
            'recommendations': recommendations,
            'technical_data': technical_data
        }
        
    except Exception as e:
        return {"error": f"Error en el análisis: {str(e)}"}

# =============================================
# RUTAS PRINCIPALES
# =============================================
@app.route('/')
def home():
    # Pasar información del usuario si está autenticado via ReplAuth
    user_data = {}
    if 'X-Replit-User-Id' in request.headers:
        user_data = {
            'user_id': request.headers.get('X-Replit-User-Id', ''),
            'user_name': request.headers.get('X-Replit-User-Name', ''),
            'user_roles': request.headers.get('X-Replit-User-Roles', ''),
            'user_bio': request.headers.get('X-Replit-User-Bio', ''),
            'user_profile_image': request.headers.get('X-Replit-User-Profile-Image', ''),
            'user_teams': request.headers.get('X-Replit-User-Teams', ''),
            'user_url': request.headers.get('X-Replit-User-Url', '')
        }
    
    return render_template('index.html', user=user_data)

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """Endpoint para análisis real de imágenes"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No se proporcionó ninguna imagen'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'Nombre de archivo vacío'}), 400
        
        # Validar tipo de archivo
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            return jsonify({'error': 'Formato de imagen no soportado'}), 400
        
        # Guardar archivo
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        
        file.save(save_path)
        
        # Realizar análisis
        result = analyze_house_image_real(save_path)
        
        if 'error' in result:
            return jsonify(result), 500
        
        # Agregar URL de la imagen al resultado
        result['image_url'] = f"/static/uploads/{unique_name}"
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Error procesando la imagen: {str(e)}'}), 500

# =============================================
# MANEJO DE ERRORES
# =============================================
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Error interno del servidor'}), 500

# =============================================
# INICIO DE LA APLICACIÓN
# =============================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('DEBUG', 'False') == 'True')
