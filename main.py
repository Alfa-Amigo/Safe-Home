from flask import Flask, render_template, request, jsonify, Blueprint
import os
from werkzeug.utils import secure_filename
import uuid
import requests
from datetime import datetime
from dotenv import load_dotenv

# =============================================
# 1. CONFIGURACIÓN INICIAL
# =============================================
load_dotenv()  # Cargar variables de entorno

app = Flask(__name__)

# Configuración de seguridad y rendimiento
app.config.update(
    UPLOAD_FOLDER='static/uploads/',
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB
    SECRET_KEY=os.environ.get('SECRET_KEY', 'default-secret-key-123'),
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    TEMPLATES_AUTO_RELOAD=False,
    PREFERRED_URL_SCHEME='https'
)

# API Keys (usar variables de entorno en producción)
API_KEYS = {
    'openweather': os.environ.get('API_KEY_OPENWEATHER', 'tu-api-key-openweather'),
    'google_maps': os.environ.get('API_KEY_GOOGLE_MAPS', 'tu-api-key-google')
}

# =============================================
# 2. FUNCIONES COMPARTIDAS
# =============================================
def analyze_house_image(image_path):
    """Analiza imágenes de viviendas y devuelve recomendaciones"""
    # Simulación de análisis con IA (en producción usar un modelo real)
    recommendations = [
        {
            'id': str(uuid.uuid4()),
            'category': 'Techo',
            'issue': 'Estructura vulnerable a vientos fuertes',
            'recommendation': 'Instalar soportes adicionales y usar materiales resistentes',
            'priority': 'Alta',
            'icon': 'fa-house-damage'
        },
        {
            'id': str(uuid.uuid4()),
            'category': 'Ventanas',
            'issue': 'Falta de protección contra huracanes',
            'recommendation': 'Instalar contraventanas o películas protectoras',
            'priority': 'Media',
            'icon': 'fa-window-maximize'
        }
    ]

    evacuation_routes = [
        {
            'id': str(uuid.uuid4()),
            'type': 'Huracán',
            'route': 'Ruta hacia el noroeste',
            'shelters': [
                {'name': 'Escuela Primaria', 'distance': '2km', 'capacity': '150 personas'},
                {'name': 'Gimnasio Municipal', 'distance': '3.5km', 'capacity': '300 personas'}
            ],
            'map_url': f'https://www.google.com/maps?q={API_KEYS["google_maps"]}'
        }
    ]

    return {
        'status': 'success',
        'analysis_id': str(uuid.uuid4()),
        'timestamp': datetime.now().isoformat(),
        'risk_level': 'Moderado-Alto',
        'recommendations': recommendations,
        'evacuation_routes': evacuation_routes
    }

def get_weather_alerts(lat, lng):
    """Obtiene alertas meteorológicas de OpenWeatherMap"""
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={API_KEYS['openweather']}&units=metric&lang=es"
        response = requests.get(url, timeout=10)
        data = response.json()

        alerts = []
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Detección de condiciones peligrosas
        weather_conditions = data.get('weather', [{}])[0]
        wind_speed = data.get('wind', {}).get('speed', 0)
        humidity = data.get('main', {}).get('humidity', 0)

        if weather_conditions.get('main') == 'Rain':
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'Lluvia intensa',
                'description': weather_conditions.get('description', 'Precipitaciones fuertes'),
                'severity': 'Alta' if humidity > 80 else 'Moderada',
                'time': current_time,
                'actions': ['Evitar zonas bajas', 'Revisar drenajes']
            })

        if wind_speed > 10:  # > 10 m/s (36 km/h)
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'Vientos fuertes',
                'description': f'Vientos de {wind_speed} m/s',
                'severity': 'Alta' if wind_speed > 15 else 'Moderada',
                'time': current_time,
                'actions': ['Asegurar objetos exteriores', 'Proteger ventanas']
            })

        return {
            'status': 'success',
            'location': {'lat': lat, 'lng': lng},
            'alerts': alerts,
            'last_update': current_time
        }

    except Exception as e:
        print(f"Error fetching weather data: {str(e)}")
        return {
            'status': 'error',
            'message': 'No se pudieron obtener alertas meteorológicas'
        }

# =============================================
# 3. APLICACIÓN 1: ANÁLISIS DE VIVIENDAS
# =============================================
house_bp = Blueprint('house_analysis', __name__, url_prefix='/house')

@house_bp.route('/', methods=['GET'])
def house_index():
    return render_template('house/index.html')

@house_bp.route('/analyze', methods=['POST'])
def analyze_house():
    # Validación de archivo
    if 'image' not in request.files:
        return jsonify({'error': 'No se encontró archivo'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Archivo no seleccionado'}), 400

    # Procesamiento seguro del archivo
    try:
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        file.save(save_path)

        # Análisis de imagen
        result = analyze_house_image(save_path)
        result['image_url'] = f"/static/uploads/{unique_name}"

        return jsonify(result)

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': 'Error al procesar imagen'}), 500

# =============================================
# 4. APLICACIÓN 2: SISTEMA DE ALERTAS
# =============================================
alert_bp = Blueprint('alert_system', __name__, url_prefix='/alerts')

@alert_bp.route('/', methods=['GET'])
def alert_index():
    return render_template('alerts/index.html')

@alert_bp.route('/check', methods=['POST'])
def check_alerts():
    data = request.get_json()
    
    # Validación de coordenadas
    if not data or 'lat' not in data or 'lng' not in data:
        return jsonify({'error': 'Coordenadas requeridas'}), 400

    try:
        lat = float(data['lat'])
        lng = float(data['lng'])
    except ValueError:
        return jsonify({'error': 'Coordenadas inválidas'}), 400

    # Obtener alertas
    return jsonify(get_weather_alerts(lat, lng))

# =============================================
# 5. CONFIGURACIÓN FINAL
# =============================================
app.register_blueprint(house_bp)
app.register_blueprint(alert_bp)

@app.route('/')
def home():
    return render_template('index.html')

# Manejo de errores
@app.errorhandler(404)
def not_found(e):
    return render_template('error/404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error/500.html'), 500

# =============================================
# INICIO DE LA APLICACIÓN (PRODUCCIÓN)
# =============================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
