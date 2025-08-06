from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import uuid
import requests

from datetime import datetime

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Configuración básica - en producción usar variables de entorno
API_KEY_OPENWEATHER = 'tu_api_key_aqui'
API_KEY_GOOGLE_MAPS = 'tu_api_key_aqui'

# Simulación de análisis de imagen (en un proyecto real usarías un modelo de ML)
def analyze_house_image(image_path):
    # Aquí iría la lógica real de análisis con un modelo entrenado
    # Por ahora simulamos resultados basados en características comunes

    recommendations = []
    evacuation_routes = []

    # Simulación: detectar techos vulnerables
    recommendations.append({
        'category': 'Techo',
        'issue': 'Estructura del techo vulnerable',
        'recommendation': 'Reforzar la estructura del techo con soportes adicionales y considerar materiales más resistentes a vientos fuertes.',
        'priority': 'Alta'
    })

    # Simulación: ventanas grandes sin protección
    recommendations.append({
        'category': 'Ventanas',
        'issue': 'Ventanas grandes sin protección contra huracanes',
        'recommendation': 'Instalar contraventanas o películas protectoras para ventanas para prevenir daños por vientos fuertes y proyectiles.',
        'priority': 'Media'
    })

    # Simulación: rutas de evacuación
    evacuation_routes.append({
        'type': 'Huracán',
        'route': 'Evacuar hacia el noroeste, alejándose de la costa.',
        'shelters': ['Escuela Primaria Central (2km)', 'Gimnasio Municipal (3.5km)']
    })

    evacuation_routes.append({
        'type': 'Inundación',
        'route': 'Dirigirse a zonas elevadas al sur, evitar cruzar corrientes de agua.',
        'shelters': ['Centro Comunitario Alto (1.5km)', 'Iglesia de la Colina (2.8km)']
    })

    return {
        'recommendations': recommendations,
        'evacuation_routes': evacuation_routes,
        'risk_level': 'Moderado'
    }

# Simulación de alertas por ubicación
def get_location_alerts(lat, lng):
    # Consultar API del clima
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={API_KEY_OPENWEATHER}&units=metric&lang=es"

    try:
        response = requests.get(weather_url)
        data = response.json()

        alerts = []

        # Verificar condiciones meteorológicas peligrosas
        if 'rain' in data.get('weather', [{}])[0].get('main', '').lower():
            alerts.append({
                'type': 'Lluvia intensa',
                'message': 'Posibilidad de inundaciones en las próximas horas.',
                'time': datetime.now().strftime('%H:%M')
            })

        if data.get('wind', {}).get('speed', 0) > 10:  # Más de 10 m/s
            alerts.append({
                'type': 'Vientos fuertes',
                'message': 'Vientos peligrosos que podrían dañar estructuras vulnerables.',
                'time': datetime.now().strftime('%H:%M')
            })

        return alerts

    except Exception as e:
        print(f"Error al obtener alertas: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Generar nombre único para el archivo
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

        # Crear directorio si no existe
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        file.save(save_path)

        # Analizar la imagen
        analysis_results = analyze_house_image(save_path)

        return jsonify({
            'status': 'success',
            'image_url': f"static/uploads/{unique_filename}",
            'analysis': analysis_results
        })

    return jsonify({'error': 'Error desconocido'}), 500

@app.route('/get-alerts', methods=['POST'])
def get_alerts():
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({'error': 'Coordenadas faltantes'}), 400

    alerts = get_location_alerts(lat, lng)

    return jsonify({
        'status': 'success',
        'alerts': alerts
    })



if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True)
