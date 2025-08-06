document.addEventListener('DOMContentLoaded', function() {
    // Initialize Swiper
    const swiper = new Swiper('.recommendation-slider', {
        slidesPerView: 1,
        spaceBetween: 20,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.slider-next',
            prevEl: '.slider-prev',
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            }
        }
    });

    // Initialize Map
    const map = L.map('riskMap').setView([19.4326, -99.1332], 12); // Default to Mexico City
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add sample risk zones
    const highRiskZone = L.circle([19.4326, -99.1332], {
        color: '#f72585',
        fillColor: '#f72585',
        fillOpacity: 0.3,
        radius: 1000
    }).addTo(map).bindPopup("Zona de alto riesgo: Inundaciones frecuentes");

    const mediumRiskZone = L.circle([19.4285, -99.1276], {
        color: '#f77f00',
        fillColor: '#f77f00',
        fillOpacity: 0.3,
        radius: 800
    }).addTo(map).bindPopup("Zona de riesgo medio: Vientos fuertes");

    // Locate me button
    document.getElementById('locateMe').addEventListener('click', function() {
        map.locate({setView: true, maxZoom: 15});
    });

    map.on('locationfound', function(e) {
        L.marker(e.latlng).addTo(map)
            .bindPopup("Tu ubicación actual").openPopup();
        
        L.circle(e.latlng, e.accuracy/2).addTo(map);
    });

    // File upload functionality
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    cancelBtn.addEventListener('click', resetFileInput);

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            alert('Por favor selecciona una imagen');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            previewImage.src = event.target.result;
            uploadArea.classList.add('hidden');
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    function resetFileInput() {
        fileInput.value = '';
        previewImage.src = '';
        uploadArea.classList.remove('hidden');
        imagePreview.classList.add('hidden');
    }

    // Analyze button functionality
    analyzeBtn.addEventListener('click', function() {
        const file = fileInput.files[0];
        if (!file) return;

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analizando...';

        // Simulate API call
        setTimeout(() => {
            showAnalysisResults();
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analizar imagen';
        }, 2000);
    });

    function showAnalysisResults() {
        // Sample data - in a real app this would come from your Flask backend
        const sampleData = {
            riskLevel: 'Moderado',
            vulnerabilities: [
                {
                    title: 'Techo vulnerable',
                    description: 'La estructura del techo muestra signos de debilidad que podrían colapsar con vientos fuertes.'
                },
                {
                    title: 'Ventanas sin protección',
                    description: 'Las ventanas grandes no tienen protección contra huracanes o tormentas.'
                }
            ],
            routes: [
                {
                    type: 'Huracán',
                    description: 'Evacuar hacia el noroeste, alejándose de la costa.',
                    shelters: ['Escuela Primaria Central (2km)', 'Gimnasio Municipal (3.5km)']
                },
                {
                    type: 'Inundación',
                    description: 'Dirigirse a zonas elevadas al sur, evitar cruzar corrientes de agua.',
                    shelters: ['Centro Comunitario Alto (1.5km)', 'Iglesia de la Colina (2.8km)']
                }
            ],
            recommendations: [
                {
                    title: 'Refuerzo estructural',
                    description: 'Considera contratar un ingeniero para evaluar y reforzar la estructura de tu hogar.'
                },
                {
                    title: 'Kit de emergencia',
                    description: 'Prepara un kit con suministros para al menos 72 horas.'
                }
            ]
        };

        // Update risk badge
        document.getElementById('riskBadge').textContent = `Riesgo ${sampleData.riskLevel}`;
        
        // Update vulnerabilities
        const vulnerabilitiesList = document.getElementById('vulnerabilitiesList');
        vulnerabilitiesList.innerHTML = '';
        sampleData.vulnerabilities.forEach(vuln => {
            const item = document.createElement('div');
            item.className = 'vulnerability-item';
            item.innerHTML = `
                <h4>${vuln.title}</h4>
                <p>${vuln.description}</p>
            `;
            vulnerabilitiesList.appendChild(item);
        });

        // Update evacuation routes
        const evacuationRoutes = document.getElementById('evacuationRoutes');
        evacuationRoutes.innerHTML = '';
        sampleData.routes.forEach(route => {
            const item = document.createElement('div');
            item.className = 'route-item';
            
            let sheltersHtml = '<ul>';
            route.shelters.forEach(shelter => {
                sheltersHtml += `<li>${shelter}</li>`;
            });
            sheltersHtml += '</ul>';
            
            item.innerHTML = `
                <h4>${route.type}</h4>
                <p>${route.description}</p>
                <div class="shelters">${sheltersHtml}</div>
            `;
            evacuationRoutes.appendChild(item);
        });

        // Update recommendations
        const improvementTips = document.getElementById('improvementTips');
        improvementTips.innerHTML = '';
        sampleData.recommendations.forEach(tip => {
            const item = document.createElement('div');
            item.className = 'tip-item';
            item.innerHTML = `
                <h4>${tip.title}</h4>
                <p>${tip.description}</p>
            `;
            improvementTips.appendChild(item);
        });

        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

        // Update global risk level
        document.querySelector('#globalRiskLevel strong').textContent = sampleData.riskLevel;
        document.getElementById('riskBar').style.width = sampleData.riskLevel === 'Alto' ? '80%' : 
                                                       sampleData.riskLevel === 'Moderado' ? '50%' : '20%';
    }

    // Add sample recommendations to slider
    const sampleRecommendations = [
        {
            category: 'Estructural',
            title: 'Refuerza tu techo',
            content: 'Los techos planos son vulnerables a huracanes. Considera instalar soportes adicionales.',
            priority: 'Alta'
        },
        {
            category: 'Preparación',
            title: 'Kit de emergencia',
            content: 'Prepara un kit con agua, alimentos no perecederos y medicinas para al menos 3 días.',
            priority: 'Media'
        },
        {
            category: 'Exterior',
            title: 'Protege ventanas',
            content: 'Instala contraventanas o películas protectoras para prevenir daños por vientos fuertes.',
            priority: 'Alta'
        },
        {
            category: 'Seguridad',
            title: 'Plan familiar',
            content: 'Establece un punto de encuentro familiar en caso de evacuación.',
            priority: 'Media'
        }
    ];

    const sliderWrapper = document.querySelector('.swiper-wrapper');
    sampleRecommendations.forEach(rec => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <span class="slide-category">${rec.category}</span>
            <h4 class="slide-title">${rec.title}</h4>
            <p class="slide-content">${rec.content}</p>
            <div class="slide-priority ${rec.priority === 'Alta' ? 'priority-high' : 
                                        rec.priority === 'Media' ? 'priority-medium' : 'priority-low'}">
                <i class="fas fa-exclamation-circle"></i>
                <span>Prioridad ${rec.priority}</span>
            </div>
        `;
        sliderWrapper.appendChild(slide);
    });

    // Reinitialize swiper after adding slides
    swiper.update();
});
