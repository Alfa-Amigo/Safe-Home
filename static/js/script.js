// ===== CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES =====
class SafeHomeApp {
    constructor() {
        this.map = null;
        this.swiper = null;
        this.chatbot = null;
        this.isListening = false;
        this.recognition = null;
        this.currentAnalysis = null;
        this.earthquakeAlertsActive = false;
        
        this.init();
    }

    // ===== INICIALIZACIÓN PRINCIPAL =====
    init() {
        this.initSwiper();
        this.initMap();
        this.initChatbot();
        this.initVoiceRecognition();
        this.setupEventListeners();
        this.loadSampleData();
    }

    // ===== CONFIGURACIÓN DEL SWIPER =====
    initSwiper() {
        this.swiper = new Swiper('.recommendation-slider', {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true
            },
            navigation: {
                nextEl: '.slider-next',
                prevEl: '.slider-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 1,
                },
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                }
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            effect: 'slide',
            speed: 600
        });
    }

    // ===== CONFIGURACIÓN DEL MAPA =====
    initMap() {
        // Inicializar mapa centrado en México City
        this.map = L.map('riskMap').setView([19.4326, -99.1332], 12);
        
        // Capa base de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Agregar zonas de riesgo de ejemplo
        this.addRiskZones();
        
        // Configurar geolocalización
        this.setupGeolocation();
    }

    addRiskZones() {
        // Zona de alto riesgo
        const highRiskZone = L.circle([19.4326, -99.1332], {
            color: '#EF476F',
            fillColor: '#EF476F',
            fillOpacity: 0.3,
            radius: 800
        }).addTo(this.map).bindPopup(`
            <div class="risk-popup">
                <h4>🚨 Zona de Alto Riesgo</h4>
                <p><strong>Inundaciones frecuentes</strong></p>
                <p>Nivel de riesgo: Alto</p>
                <p>Recomendación: Evacuar en temporada de lluvias</p>
            </div>
        `);

        // Zona de riesgo medio
        const mediumRiskZone = L.circle([19.4285, -99.1276], {
            color: '#FF9E00',
            fillColor: '#FF9E00',
            fillOpacity: 0.3,
            radius: 600
        }).addTo(this.map).bindPopup(`
            <div class="risk-popup">
                <h4>⚠️ Zona de Riesgo Medio</h4>
                <p><strong>Vientos fuertes</strong></p>
                <p>Nivel de riesgo: Medio</p>
                <p>Recomendación: Asegurar objetos exteriores</p>
            </div>
        `);

        // Zona de bajo riesgo
        const lowRiskZone = L.circle([19.4360, -99.1390], {
            color: '#06D6A0',
            fillColor: '#06D6A0',
            fillOpacity: 0.3,
            radius: 500
        }).addTo(this.map).bindPopup(`
            <div class="risk-popup">
                <h4>✅ Zona de Bajo Riesgo</h4>
                <p><strong>Estable</strong></p>
                <p>Nivel de riesgo: Bajo</p>
                <p>Recomendación: Mantener medidas preventivas</p>
            </div>
        `);
    }

    setupGeolocation() {
        const locateButton = document.getElementById('locateMe');
        
        locateButton.addEventListener('click', () => {
            this.map.locate({ 
                setView: true, 
                maxZoom: 16,
                enableHighAccuracy: true 
            });
        });

        this.map.on('locationfound', (e) => {
            const radius = e.accuracy / 2;
            
            L.marker(e.latlng)
                .addTo(this.map)
                .bindPopup(`<b>Tu ubicación actual</b><br>Precisión: ${radius.toFixed(1)} metros`)
                .openPopup();
            
            L.circle(e.latlng, radius)
                .addTo(this.map);
                
            // Obtener alertas meteorológicas para esta ubicación
            this.getWeatherAlerts(e.latlng.lat, e.latlng.lng);
        });

        this.map.on('locationerror', (e) => {
            alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso a la ubicación.');
            console.error('Error de geolocalización:', e.message);
        });
    }

    // ===== CHATBOT INTELIGENTE =====
    initChatbot() {
        this.setupChatbotUI();
        this.setupChatbotResponses();
    }

    setupChatbotUI() {
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotSend = document.getElementById('chatbotSend');
        const chatbotInput = document.getElementById('chatbotInput');
        const voiceSearchBtn = document.getElementById('voiceSearchBtn');

        // Toggle del chatbot
        chatbotToggle.addEventListener('click', () => {
            this.toggleChatbot();
        });

        chatbotClose.addEventListener('click', () => {
            this.closeChatbot();
        });

        // Envío de mensajes
        chatbotSend.addEventListener('click', () => {
            this.sendChatbotMessage();
        });

        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatbotMessage();
            }
        });

        // Búsqueda por voz en chatbot
        voiceSearchBtn.addEventListener('click', () => {
            this.toggleVoiceSearch('chatbot');
        });

        // Búsqueda por voz global
        const globalVoiceSearchBtn = document.getElementById('globalVoiceSearchBtn');
        if (globalVoiceSearchBtn) {
            globalVoiceSearchBtn.addEventListener('click', () => {
                this.toggleVoiceSearch('global');
            });
        }

        // Búsqueda global
        const globalSearchBtn = document.getElementById('globalSearchBtn');
        const globalSearchInput = document.getElementById('globalSearch');
        
        if (globalSearchBtn && globalSearchInput) {
            globalSearchBtn.addEventListener('click', () => {
                this.performGlobalSearch(globalSearchInput.value);
            });

            globalSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performGlobalSearch(globalSearchInput.value);
                }
            });
        }
    }

    setupChatbotResponses() {
        this.chatbotResponses = {
            'grieta': {
                response: 'Para analizar grietas, sube una foto de la zona afectada en la sección "Analiza tu propiedad". Te daré recomendaciones específicas según el tipo y severidad de las grietas.',
                actions: ['showUploadSection']
            },
            'emergencia': {
                response: '🚨 **PROTOCOLO DE EMERGENCIA** 🚨\n\n1. Mantén la calma\n2. Activa alertas sísmicas\n3. Contacta emergencias:\n   • Protección Civil: 56 83 22 22\n   • Bomberos: 57 84 2124\n   • Cruz Roja: 53 95 11 11\n4. Sigue rutas de evacuación',
                actions: ['showEmergencyModal']
            },
            'estructura': {
                response: '🔧 **EVALUACIÓN ESTRUCTURAL**\n\nRecomendaciones:\n• Revisar cimientos anualmente\n• Verificar columnas y vigas\n• Consultar ingeniero estructural\n• Monitorear grietas existentes\n• Realizar mantenimiento preventivo',
                actions: []
            },
            'terremoto': {
                response: '🏢 **PROTOCOLO SÍSMICO**\n\n**ANTES:**\n• Prepara kit de emergencia\n• Identifica zonas seguras\n• Fija muebles altos\n\n**DURANTE:**\n• Protégete bajo marcos/mesas\n• Aléjate de ventanas\n• No uses ascensores\n\n**DESPUÉS:**\n• Revisa daños estructurales\n• Evacúa si es necesario\n• Reporta emergencias',
                actions: []
            },
            'inundación': {
                response: '🌊 **PREVENCIÓN DE INUNDACIONES**\n\n• Instala barreras impermeables\n• Mantén desagües limpios\n• Eleva equipos eléctricos\n• Ten un plan de evacuación\n• Monitorea alertas meteorológicas',
                actions: []
            },
            'kit': {
                response: '🎒 **KIT DE EMERGENCIA BÁSICO**\n\n• Agua (4L por persona/día)\n• Alimentos no perecederos\n• Botiquín de primeros auxilios\n• Linterna y radio\n• Documentos importantes\n• Medicamentos\n• Dinero en efectivo\n• Manta térmica',
                actions: []
            },
            'analizar': {
                response: 'Para analizar tu propiedad:\n1. Ve a "Analiza tu propiedad"\n2. Sube una foto clara\n3. Espera el análisis de IA\n4. Recibe recomendaciones personalizadas\n\n¿Quieres que te guíe paso a paso?',
                actions: ['showUploadSection']
            },
            'hola': {
                response: '¡Hola! 👋 Soy tu asistente de SafeHome.\n\nPuedo ayudarte con:\n• 📸 Análisis de grietas\n• 🏠 Recomendaciones estructurales\n• 🚨 Protocolos de emergencia\n• 🗺️ Rutas de evacuación\n• 📋 Kits de seguridad\n\n¿En qué puedo asistirte hoy?',
                actions: []
            },
            'gracias': {
                response: '¡De nada! 😊 Estoy aquí para ayudarte a mantener tu hogar seguro.\n\nRecuerda: La prevención es la mejor protección. ¿En qué más puedo ayudarte?',
                actions: []
            },
            'default': {
                response: 'Puedo ayudarte con:\n\n• **Análisis de grietas** - Sube fotos para evaluación\n• **Recomendaciones estructurales** - Mejora la seguridad de tu hogar\n• **Preparación para emergencias** - Protocolos y kits\n• **Alertas meteorológicas** - Monitoreo en tiempo real\n\n¿En qué aspecto específico necesitas ayuda?',
                actions: []
            }
        };
    }

    toggleChatbot() {
        const widget = document.getElementById('chatbotWidget');
        widget.classList.toggle('active');
        
        if (widget.classList.contains('active')) {
            document.getElementById('chatbotInput').focus();
        }
    }

    closeChatbot() {
        const widget = document.getElementById('chatbotWidget');
        widget.classList.remove('active');
    }

    sendChatbotMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage(message, 'user');
            this.processChatbotMessage(message);
            input.value = '';
        }
    }

    addChatMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(text)}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Efecto de escritura para mensajes del bot
        if (sender === 'bot') {
            this.typewriterEffect(messageDiv.querySelector('.message-content'), text);
        }
    }

    typewriterEffect(element, text) {
        element.innerHTML = '';
        let i = 0;
        const speed = 20;
        
        function typeWriter() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        }
        typeWriter();
    }

    formatMessage(text) {
        // Formato básico de markdown
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/(•|▶|✓)\s*(.*?)(?=\n|$)/g, '<span class="list-item">$1 $2</span>');
    }

    processChatbotMessage(message) {
        const lowerMessage = message.toLowerCase();
        let response = this.chatbotResponses.default;
        
        // Buscar coincidencia de palabras clave
        for (const [keyword, data] of Object.entries(this.chatbotResponses)) {
            if (lowerMessage.includes(keyword) && keyword !== 'default') {
                response = data;
                break;
            }
        }
        
        // Simular tiempo de procesamiento
        setTimeout(() => {
            this.addChatMessage(response.response, 'bot');
            
            // Ejecutar acciones asociadas
            response.actions.forEach(action => {
                this.executeChatbotAction(action);
            });
        }, 1000);
    }

    executeChatbotAction(action) {
        switch(action) {
            case 'showUploadSection':
                document.querySelector('.upload-section').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
                break;
            case 'showEmergencyModal':
                this.showEmergencyModal();
                break;
        }
    }

    // ===== BÚSQUEDA POR VOZ =====
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI(true);
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Error en reconocimiento de voz:', event.error);
                this.addChatMessage('Lo siento, hubo un error con el reconocimiento de voz. Intenta nuevamente.', 'bot');
                this.stopVoiceSearch();
            };

            this.recognition.onend = () => {
                this.stopVoiceSearch();
            };
        } else {
            console.warn('El reconocimiento de voz no es compatible con este navegador');
        }
    }

    toggleVoiceSearch(context = 'chatbot') {
        if (!this.recognition) {
            alert('El reconocimiento de voz no está disponible en tu navegador.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.context = context;
            this.recognition.start();
        }
    }

    updateVoiceUI(listening) {
        const voiceButtons = document.querySelectorAll('#voiceSearchBtn, #globalVoiceSearchBtn');
        
        voiceButtons.forEach(btn => {
            if (listening) {
                btn.classList.add('voice-listening');
                btn.innerHTML = '<i class="fas fa-circle"></i>';
            } else {
                btn.classList.remove('voice-listening');
                btn.innerHTML = '<i class="fas fa-microphone"></i>';
            }
        });

        if (this.context === 'chatbot' && listening) {
            this.addChatMessage('🎤 Escuchando... Habla ahora.', 'bot');
        }
    }

    stopVoiceSearch() {
        this.isListening = false;
        this.updateVoiceUI(false);
    }

    processVoiceInput(transcript) {
        if (this.context === 'chatbot') {
            document.getElementById('chatbotInput').value = transcript;
            this.addChatMessage(transcript, 'user');
            this.processChatbotMessage(transcript);
        } else if (this.context === 'global') {
            document.getElementById('globalSearch').value = transcript;
            this.performGlobalSearch(transcript);
        }
    }

    performGlobalSearch(query) {
        if (!query.trim()) return;

        const lowerQuery = query.toLowerCase();
        
        // Buscar en diferentes secciones
        if (lowerQuery.includes('grieta') || lowerQuery.includes('daño') || lowerQuery.includes('estructura')) {
            document.querySelector('.upload-section').scrollIntoView({ behavior: 'smooth' });
            this.showNotification('🔍 Te llevo a la sección de análisis de grietas');
        } else if (lowerQuery.includes('emergencia') || lowerQuery.includes('alerta') || lowerQuery.includes('terremoto')) {
            this.showEmergencyModal();
            this.showNotification('🚨 Abriendo números de emergencia');
        } else if (lowerQuery.includes('mapa') || lowerQuery.includes('riesgo') || lowerQuery.includes('zona')) {
            document.querySelector('.map-section').scrollIntoView({ behavior: 'smooth' });
            this.showNotification('🗺️ Mostrando mapa de riesgos');
        } else if (lowerQuery.includes('recomendación') || lowerQuery.includes('consejo') || lowerQuery.includes('tip')) {
            document.querySelector('.slider-section').scrollIntoView({ behavior: 'smooth' });
            this.showNotification('💡 Mostrando recomendaciones de seguridad');
        } else {
            // Búsqueda general - abrir chatbot
            this.toggleChatbot();
            setTimeout(() => {
                this.addChatMessage(query, 'user');
                this.processChatbotMessage(query);
            }, 500);
        }
    }

    // ===== ANÁLISIS DE IMÁGENES =====
    setupImageAnalysis() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        cancelBtn.addEventListener('click', () => this.resetFileInput());
        analyzeBtn.addEventListener('click', () => this.analyzeImage());
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            this.showNotification('❌ Por favor selecciona una imagen válida', 'error');
            return;
        }

        if (file.size > 16 * 1024 * 1024) {
            this.showNotification('❌ La imagen es demasiado grande (máximo 16MB)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('previewImage').src = event.target.result;
            document.getElementById('uploadArea').classList.add('hidden');
            document.getElementById('imagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    resetFileInput() {
        document.getElementById('fileInput').value = '';
        document.getElementById('previewImage').src = '';
        document.getElementById('uploadArea').classList.remove('hidden');
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('analysisProgress').classList.add('hidden');
        document.getElementById('analysisDetails').classList.add('hidden');
        document.getElementById('crackAnalysis').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
    }

    async analyzeImage() {
        const file = document.getElementById('fileInput').files[0];
        if (!file) return;

        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analizando...';

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        document.getElementById('analysisProgress').classList.remove('hidden');
        
        // Simular progreso
        await this.simulateProgress(progressFill, progressText);
        
        // Análisis real con detección de grietas
        await this.analyzeImageForCracks(file);
        
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analizar imagen';
    }

    simulateProgress(progressFill, progressText) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 100) progress = 100;
                
                progressFill.style.width = `${progress}%`;
                
                if (progress < 20) {
                    progressText.textContent = '🔍 Cargando modelo de IA...';
                } else if (progress < 50) {
                    progressText.textContent = '🏠 Analizando estructuras...';
                } else if (progress < 80) {
                    progressText.textContent = '📐 Detectando grietas...';
                } else {
                    progressText.textContent = '💡 Generando recomendaciones...';
                }
                
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
            }, 300);
        });
    }

    async analyzeImageForCracks(file) {
        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            img.onload = () => {
                const origCtx = document.getElementById('originalCanvas').getContext('2d');
                const crackCtx = document.getElementById('crackCanvas').getContext('2d');
                
                // Configurar canvases
                const maxWidth = 500;
                const ratio = Math.min(maxWidth / img.width, 1);
                const canvasWidth = img.width * ratio;
                const canvasHeight = img.height * ratio;
                
                [origCtx.canvas, crackCtx.canvas].forEach(canvas => {
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                });
                
                // Dibujar imagen original
                origCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                
                // Detectar grietas
                const crackData = this.detectCracks(origCtx, canvasWidth, canvasHeight);
                
                // Dibujar grietas detectadas
                this.drawCracks(crackCtx, crackData, canvasWidth, canvasHeight);
                
                // Actualizar métricas
                this.updateCrackMetrics(crackData);
                
                // Procesar resultados
                this.processAnalysisResults(crackData);
            };
            
        } catch (error) {
            console.error('Error analizando imagen:', error);
            // Fallback a análisis simulado
            setTimeout(() => {
                const mockData = {
                    points: Array(150).fill().map(() => ({
                        x: Math.random() * 500,
                        y: Math.random() * 500,
                        strength: Math.random() * 100,
                        intensity: Math.random() * 255
                    })),
                    totalLength: 245.67,
                    count: 8
                };
                this.processAnalysisResults(mockData);
            }, 2000);
        }
    }

    detectCracks(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const cracks = [];
        let totalLength = 0;
        
        // Algoritmo simplificado de detección de bordes
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // Calcular diferencia de intensidad con píxeles circundantes
                const topIdx = ((y - 1) * width + x) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;
                const leftIdx = (y * width + (x - 1)) * 4;
                const rightIdx = (y * width + (x + 1)) * 4;
                
                const verticalDiff = Math.abs(
                    (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3 - 
                    (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3
                );
                
                const horizontalDiff = Math.abs(
                    (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3 - 
                    (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3
                );
                
                const edgeStrength = (verticalDiff + horizontalDiff) / 2;
                
                // Detectar píxeles de grieta (bordes fuertes en áreas oscuras)
                if (edgeStrength > 20) {
                    const intensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    if (intensity < 120) {
                        cracks.push({
                            x: x,
                            y: y,
                            strength: edgeStrength,
                            intensity: intensity
                        });
                        totalLength += Math.sqrt(verticalDiff * verticalDiff + horizontalDiff * horizontalDiff);
                    }
                }
            }
        }
        
        return {
            points: cracks,
            totalLength: totalLength,
            count: Math.max(1, Math.round(cracks.length / 50))
        };
    }

    drawCracks(ctx, crackData, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Dibujar imagen original de fondo
        ctx.globalAlpha = 0.3;
        ctx.drawImage(document.getElementById('originalCanvas'), 0, 0);
        ctx.globalAlpha = 1.0;
        
        // Dibujar grietas
        if (crackData.points.length > 0) {
            ctx.fillStyle = '#EF476F';
            
            crackData.points.forEach(point => {
                const size = Math.max(1, Math.min(4, point.strength / 25));
                ctx.fillRect(point.x, point.y, size, size);
            });
        }
    }

    updateCrackMetrics(crackData) {
        document.getElementById('crackCount').textContent = crackData.count;
        
        const estimatedLength = (crackData.totalLength / 80).toFixed(1);
        document.getElementById('crackLength').textContent = `${estimatedLength} cm`;
        
        let severity = "Baja";
        if (crackData.count > 10) severity = "Alta";
        else if (crackData.count > 5) severity = "Media";
        
        document.getElementById('crackSeverity').textContent = severity;
        document.getElementById('crackAnalysis').classList.remove('hidden');
    }

    processAnalysisResults(crackData) {
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').textContent = '✅ Análisis completado';
        
        document.getElementById('analysisDetails').classList.remove('hidden');
        
        const detectionResults = document.getElementById('detectionResults');
        detectionResults.innerHTML = '';
        
        if (crackData.count > 0) {
            const detectionItem = document.createElement('div');
            detectionItem.className = 'detection-item';
            detectionItem.innerHTML = `
                <div class="detection-icon">
                    <i class="fas fa-crack"></i>
                </div>
                <div class="detection-content">
                    <h4>Grietas estructurales detectadas</h4>
                    <p>Se han identificado ${crackData.count} grietas con una longitud total de ${document.getElementById('crackLength').textContent}</p>
                    <div class="detection-confidence">
                        <div class="confidence-fill" style="width: ${Math.min(100, crackData.count * 12)}%"></div>
                    </div>
                    <small>Severidad: ${document.getElementById('crackSeverity').textContent}</small>
                </div>
            `;
            detectionResults.appendChild(detectionItem);
        } else {
            detectionResults.innerHTML = `
                <div class="detection-item">
                    <div class="detection-icon" style="background: var(--success);">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="detection-content">
                        <h4>Sin grietas significativas</h4>
                        <p>No se detectaron grietas estructurales preocupantes en la imagen analizada.</p>
                    </div>
                </div>
            `;
        }
        
        // Mostrar resultados completos
        setTimeout(() => {
            this.showAnalysisResults(crackData);
        }, 1000);
    }

    showAnalysisResults(analysisData = null) {
        const riskLevel = analysisData && analysisData.count > 5 ? 'Alto' : 
                         analysisData && analysisData.count > 2 ? 'Moderado' : 'Bajo';
        
        const results = {
            riskLevel: riskLevel,
            vulnerabilities: [
                {
                    title: analysisData && analysisData.count > 0 ? 'Grietas detectadas' : 'Sin grietas críticas',
                    description: analysisData && analysisData.count > 0 ? 
                        'Se encontraron grietas en la estructura que requieren evaluación profesional.' :
                        'La estructura aparenta estar en buen estado. Mantén revisiones periódicas.'
                },
                {
                    title: 'Ventanas sin protección',
                    description: 'Considera instalar películas de seguridad en ventanas grandes.'
                }
            ],
            routes: [
                {
                    type: 'Evacuación general',
                    description: 'Ruta principal hacia zonas seguras elevadas.',
                    shelters: ['Escuela Primaria Central (2km)', 'Gimnasio Municipal (3.5km)']
                }
            ],
            recommendations: [
                {
                    title: analysisData && analysisData.count > 0 ? 'Evaluación profesional' : 'Mantenimiento preventivo',
                    description: analysisData && analysisData.count > 0 ?
                        'Consulta con un ingeniero estructural para evaluación detallada.' :
                        'Continúa con revisiones periódicas y mantenimiento preventivo.'
                },
                {
                    title: 'Kit de emergencia',
                    description: 'Actualiza tu kit de emergencia cada 6 meses.'
                }
            ]
        };

        // Actualizar interfaz
        this.updateResultsUI(results);
        
        // Mostrar sección de resultados
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        
        // Actualizar riesgo global
        this.updateGlobalRiskLevel(riskLevel);
    }

    updateResultsUI(results) {
        // Badge de riesgo
        const riskBadge = document.getElementById('riskBadge');
        riskBadge.textContent = `Riesgo ${results.riskLevel}`;
        riskBadge.className = `risk-badge ${results.riskLevel.toLowerCase()}-risk`;
        
        // Vulnerabilidades
        const vulnerabilitiesList = document.getElementById('vulnerabilitiesList');
        vulnerabilitiesList.innerHTML = '';
        results.vulnerabilities.forEach(vuln => {
            const item = document.createElement('div');
            item.className = 'vulnerability-item';
            item.innerHTML = `<h4>${vuln.title}</h4><p>${vuln.description}</p>`;
            vulnerabilitiesList.appendChild(item);
        });
        
        // Rutas de evacuación
        const evacuationRoutes = document.getElementById('evacuationRoutes');
        evacuationRoutes.innerHTML = '';
        results.routes.forEach(route => {
            const sheltersHtml = route.shelters.map(shelter => `<li>${shelter}</li>`).join('');
            const item = document.createElement('div');
            item.className = 'route-item';
            item.innerHTML = `
                <h4>${route.type}</h4>
                <p>${route.description}</p>
                <ul>${sheltersHtml}</ul>
            `;
            evacuationRoutes.appendChild(item);
        });
        
        // Recomendaciones
        const improvementTips = document.getElementById('improvementTips');
        improvementTips.innerHTML = '';
        results.recommendations.forEach(tip => {
            const item = document.createElement('div');
            item.className = 'tip-item';
            item.innerHTML = `<h4>${tip.title}</h4><p>${tip.description}</p>`;
            improvementTips.appendChild(item);
        });
    }

    updateGlobalRiskLevel(riskLevel) {
        document.querySelector('#globalRiskLevel strong').textContent = riskLevel;
        const riskBar = document.getElementById('riskBar');
        
        if (riskLevel === 'Alto') {
            riskBar.style.width = '85%';
            riskBar.style.background = 'var(--danger)';
        } else if (riskLevel === 'Moderado') {
            riskBar.style.width = '55%';
            riskBar.style.background = 'var(--warning)';
        } else {
            riskBar.style.width = '25%';
            riskBar.style.background = 'var(--success)';
        }
    }

    // ===== SISTEMA DE ALERTAS =====
    setupAlertSystem() {
        const earthquakeToggle = document.getElementById('earthquakeToggle');
        const earthquakeStatus = document.getElementById('earthquakeStatus');
        const emergencyNumbersBtn = document.getElementById('emergencyNumbersBtn');

        // Toggle de alertas sísmicas
        if (earthquakeToggle) {
            earthquakeToggle.addEventListener('change', (e) => {
                this.earthquakeAlertsActive = e.target.checked;
                earthquakeStatus.textContent = this.earthquakeAlertsActive ? 'Activado' : 'Inactivo';
                earthquakeStatus.style.color = this.earthquakeAlertsActive ? 'var(--success)' : '';
                
                if (this.earthquakeAlertsActive) {
                    this.showNotification('🔔 Alertas sísmicas activadas');
                    // Simular alerta después de 5 segundos (demo)
                    setTimeout(() => {
                        this.showEarthquakeAlert();
                    }, 5000);
                }
            });
        }

        // Botón de números de emergencia
        if (emergencyNumbersBtn) {
            emergencyNumbersBtn.addEventListener('click', () => {
                this.showEmergencyModal();
            });
        }

        // Cerrar alerta de terremoto
        document.querySelector('.close-alert')?.addEventListener('click', () => {
            this.hideEarthquakeAlert();
        });

        // Botones de llamada
        document.querySelectorAll('.call-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = e.target.closest('.emergency-item').querySelector('.emergency-number').textContent;
                this.simulateCall(number);
            });
        });

        // Cerrar modal de emergencia
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            this.hideEmergencyModal();
        });

        // Cerrar modal al hacer clic fuera
        document.getElementById('emergencyModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('emergencyModal')) {
                this.hideEmergencyModal();
            }
        });
    }

    showEarthquakeAlert() {
        if (!this.earthquakeAlertsActive) return;
        
        const alert = document.getElementById('earthquakeAlert');
        alert.style.display = 'block';
        
        // Sonido de alerta (opcional)
        this.playAlertSound();
        
        // Ocultar automáticamente después de 15 segundos
        setTimeout(() => {
            this.hideEarthquakeAlert();
        }, 15000);
    }

    hideEarthquakeAlert() {
        document.getElementById('earthquakeAlert').style.display = 'none';
    }

    showEmergencyModal() {
        document.getElementById('emergencyModal').style.display = 'flex';
    }

    hideEmergencyModal() {
        document.getElementById('emergencyModal').style.display = 'none';
    }

    simulateCall(number) {
        this.showNotification(`📞 Llamando a ${number}...\n\nNota: Esta es una simulación. En una aplicación real se iniciaría la llamada.`);
    }

    playAlertSound() {
        // Crear sonido de alerta simple usando Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio no disponible:', error);
        }
    }

    // ===== ALERTAS METEOROLÓGICAS =====
    async getWeatherAlerts(lat, lng) {
        try {
            // Simulación de API de clima
            const mockAlerts = this.generateMockWeatherAlerts(lat, lng);
            
            if (mockAlerts.length > 0) {
                this.showNotification(`🌦️ ${mockAlerts.length} alerta(s) meteorológica(s) para tu zona`);
                
                // Agregar marcador de alerta en el mapa
                L.marker([lat, lng])
                    .addTo(this.map)
                    .bindPopup(`
                        <div class="weather-alert-popup">
                            <h4>⚠️ Alertas Meteorológicas</h4>
                            ${mockAlerts.map(alert => `
                                <p><strong>${alert.type}:</strong> ${alert.description}</p>
                            `).join('')}
                        </div>
                    `)
                    .openPopup();
            }
        } catch (error) {
            console.error('Error obteniendo alertas meteorológicas:', error);
        }
    }

    generateMockWeatherAlerts(lat, lng) {
        const alerts = [];
        const conditions = ['Lluvia intensa', 'Vientos fuertes', 'Tormenta eléctrica', 'Granizo'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        if (Math.random() > 0.5) {
            alerts.push({
                type: randomCondition,
                description: 'Se esperan condiciones adversas en las próximas horas',
                severity: 'Moderada',
                time: new Date().toLocaleTimeString()
            });
        }
        
        return alerts;
    }

    // ===== NOTIFICACIONES =====
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'var(--danger)' : 'var(--primary)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Cerrar al hacer clic
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // ===== CARGA DE DATOS DE EJEMPLO =====
    loadSampleData() {
        this.loadSampleRecommendations();
        this.setupImageAnalysis();
        this.setupAlertSystem();
    }

    loadSampleRecommendations() {
        const sampleRecommendations = [
            {
                category: 'Estructural',
                title: 'Refuerza tu techo',
                content: 'Los techos planos son vulnerables a huracanes. Considera instalar soportes adicionales y revisar la estructura cada 2 años.',
                priority: 'Alta',
                icon: 'fa-house-damage'
            },
            {
                category: 'Preparación',
                title: 'Kit de emergencia',
                content: 'Prepara un kit con agua, alimentos no perecederos, medicinas y documentos importantes para al menos 3 días.',
                priority: 'Media',
                icon: 'fa-first-aid'
            },
            {
                category: 'Exterior',
                title: 'Protege ventanas',
                content: 'Instala contraventanas o películas protectoras para prevenir daños por vientos fuertes y proyectiles.',
                priority: 'Alta',
                icon: 'fa-window-maximize'
            },
            {
                category: 'Seguridad',
                title: 'Plan familiar',
                content: 'Establece un punto de encuentro familiar y rutas de evacuación en caso de emergencia.',
                priority: 'Media',
                icon: 'fa-people-arrows'
            },
            {
                category: 'Prevención',
                title: 'Mantenimiento regular',
                content: 'Realiza inspecciones trimestrales de grietas, humedades y daños estructurales.',
                priority: 'Baja',
                icon: 'fa-tools'
            },
            {
                category: 'Tecnología',
                title: 'Sistema de alertas',
                content: 'Instala sensores de movimiento y sistemas de alerta temprana para terremotos e inundaciones.',
                priority: 'Media',
                icon: 'fa-bell'
            }
        ];

        const sliderWrapper = document.querySelector('.swiper-wrapper');
        sliderWrapper.innerHTML = '';

        sampleRecommendations.forEach(rec => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `
                <span class="slide-category">${rec.category}</span>
                <h4 class="slide-title">${rec.title}</h4>
                <p class="slide-content">${rec.content}</p>
                <div class="slide-priority ${rec.priority === 'Alta' ? 'priority-high' : 
                                            rec.priority === 'Media' ? 'priority-medium' : 'priority-low'}">
                    <i class="fas ${rec.icon}"></i>
                    <span>Prioridad ${rec.priority}</span>
                </div>
            `;
            sliderWrapper.appendChild(slide);
        });

        // Actualizar swiper
        if (this.swiper) {
            this.swiper.update();
        }
    }

    // ===== CONFIGURACIÓN DE EVENT LISTENERS =====
    setupEventListeners() {
        // Prevenir envío de formularios
        document.addEventListener('submit', (e) => e.preventDefault());
        
        // Mejorar accesibilidad
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeChatbot();
                this.hideEmergencyModal();
                this.hideEarthquakeAlert();
            }
        });
        
        // Cargar más recomendaciones al hacer scroll
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll() {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Cargar más contenido cuando el usuario llega al final
        if (scrollPosition >= documentHeight - 500) {
            this.loadMoreContent();
        }
    }

    loadMoreContent() {
        // Simular carga de contenido adicional
        if (!this.contentLoaded) {
            this.showNotification('📚 Cargando más recomendaciones...');
            setTimeout(() => {
                this.loadSampleRecommendations();
                this.contentLoaded = true;
            }, 1000);
        }
    }
}

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación
    window.safeHomeApp = new SafeHomeApp();
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        window.safeHomeApp.showNotification('🚀 SafeHome cargado correctamente. ¡Tu hogar más seguro!');
    }, 1000);
});

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rechazada:', e.reason);
});

// ===== COMPATIBILIDAD CON NAVEGADORES ANTIGUOS =====
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function() {
        window.scrollTo(0, this.offsetTop);
    };
}
