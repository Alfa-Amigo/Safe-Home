from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
from PIL import Image
import io
import base64

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
# ANÁLISIS REAL DE IMÁGENES CON PILLOW (SIN OpenCV)
# =============================================
def analyze_house_image_real(image_path):
    """Analiza imágenes de viviendas usando procesamiento de imágenes con Pillow"""
    try:
        # Abrir imagen con Pillow
        with Image.open(image_path) as img:
            # Obtener información básica de la imagen
            width, height = img.size
            file_size = os.path.getsize(image_path)
            
            # Convertir a modo RGB si es necesario
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Análisis de calidad de imagen
            # Calcular brillo promedio (aproximado)
            brightness = calculate_brightness(img)
            
            # Analizar aspectos de la imagen para determinar riesgo
            issues = []
            recommendations = []
            
            # Evaluar calidad de imagen
            if file_size < 100000:  # Menos de 100KB
                issues.append("Imagen de baja resolución o calidad")
                recommendations.append("Tome una foto con mayor resolución para un análisis más preciso")
            
            if brightness < 50:
                issues.append("Imagen demasiado oscura")
                recommendations.append("Tome la foto con mejor iluminación natural")
            
            # Análisis de composición (proporciones)
            aspect_ratio = width / height
            if aspect_ratio < 0.5 or aspect_ratio > 2.0:
                issues.append("Composición de imagen inusual")
                recommendations.append("Tome la foto mostrando toda la fachada frontal")
            
            # Determinar nivel de riesgo basado en el análisis
            risk_score = 0
            if file_size < 100000: risk_score += 1
            if brightness < 50: risk_score += 1
            if aspect_ratio < 0.5 or aspect_ratio > 2.0: risk_score += 1
            
            if risk_score >= 2:
                risk_level = "Alto"
            elif risk_score == 1:
                risk_level = "Moderado"
            else:
                risk_level = "Bajo"
            
            # Si no hay issues específicos
            if not issues:
                issues.append("No se detectaron problemas evidentes en la imagen proporcionada")
                recommendations.append("Para un análisis más detallado, proporcione múltiples ángulos de la propiedad")
            
            # Datos técnicos
            technical_data = {
                'image_resolution': f"{width}x{height}",
                'file_size': f"{file_size/1024:.1f} KB",
                'brightness_level': f"{brightness:.1f}%",
                'aspect_ratio': f"{aspect_ratio:.2f}"
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

def calculate_brightness(img):
    """Calcula el brillo promedio de una imagen (0-100%)"""
    # Convertir a escala de grises
    grayscale = img.convert('L')
    # Obtener histograma
    hist = grayscale.histogram()
    # Calcular brillo promedio
    pixels = sum(hist)
    brightness = scale = len(hist)
    for index in range(0, scale):
        ratio = hist[index] / pixels
        brightness += ratio * (-scale + index)
    return brightness / scale

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
