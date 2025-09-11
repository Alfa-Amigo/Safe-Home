// Reemplazar la función analyzeBtn click event
analyzeBtn.addEventListener('click', function() {
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor seleccione una imagen primero');
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analizando...';

    // Crear FormData para enviar la imagen
    const formData = new FormData();
    formData.append('image', file);

    // Enviar a nuestro endpoint real
    fetch('/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error del servidor: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            showRealAnalysisResults(data);
        } else {
            throw new Error(data.error || 'Error desconocido en el análisis');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al analizar la imagen: ' + error.message);
    })
    .finally(() => {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analizar imagen';
    });
});

function showRealAnalysisResults(data) {
    // Actualizar la interfaz con resultados reales
    document.getElementById('riskBadge').textContent = `Riesgo ${data.risk_level}`;
    document.getElementById('riskBadge').className = 'risk-badge ' + 
        (data.risk_level.includes('Alto') ? 'high-risk' : 
         data.risk_level.includes('Moderado') ? 'medium-risk' : 'low-risk');
    
    // Actualizar vulnerabilidades
    const vulnerabilitiesList = document.getElementById('vulnerabilitiesList');
    vulnerabilitiesList.innerHTML = '';
    
    if (data.issues_detected && data.issues_detected.length > 0) {
        data.issues_detected.forEach(issue => {
            const item = document.createElement('div');
            item.className = 'vulnerability-item';
            item.innerHTML = `
                <h4>⚠️ Problema detectado</h4>
                <p>${issue}</p>
            `;
            vulnerabilitiesList.appendChild(item);
        });
    } else {
        vulnerabilitiesList.innerHTML = `
            <div class="vulnerability-item">
                <h4>✅ Sin problemas críticos detectados</h4>
                <p>No se encontraron vulnerabilidades evidentes en la imagen</p>
            </div>
        `;
    }

    // Actualizar recomendaciones
    const improvementTips = document.getElementById('improvementTips');
    improvementTips.innerHTML = '';
    
    if (data.recommendations && data.recommendations.length > 0) {
        data.recommendations.forEach(tip => {
            const item = document.createElement('div');
            item.className = 'tip-item';
            item.innerHTML = `
                <h4>💡 Recomendación</h4>
                <p>${tip}</p>
            `;
            improvementTips.appendChild(item);
        });
    } else {
        improvementTips.innerHTML = `
            <div class="tip-item">
                <h4>👍 Buen estado</h4>
                <p>Su propiedad parece estar en buenas condiciones</p>
            </div>
        `;
    }

    // Actualizar rutas de evacuación (genéricas basadas en riesgo)
    const evacuationRoutes = document.getElementById('evacuationRoutes');
    evacuationRoutes.innerHTML = '';
    
    const routes = [];
    if (data.risk_level.includes('Alto')) {
        routes.push({
            type: 'Evacuación Inmediata',
            description: 'Salga del inmueble y busque un área abierta',
            shelters: ['Parque más cercano', 'Plaza pública']
        });
    }
    
    routes.push({
        type: 'Punto de Encuentro',
        description: 'Establezca un punto de reunión familiar',
        shelters: ['Casa de vecino seguro', 'Edificio público cercano']
    });
    
    routes.forEach(route => {
        const item = document.createElement('div');
        item.className = 'route-item';
        
        let sheltersHtml = '<strong>Refugios sugeridos:</strong><ul>';
        if (route.shelters && route.shelters.length > 0) {
            route.shelters.forEach(shelter => {
                sheltersHtml += `<li>${shelter}</li>`;
            });
        }
        sheltersHtml += '</ul>';
        
        item.innerHTML = `
            <h4>${route.type}</h4>
            <p>${route.description}</p>
            <div class="shelters">${sheltersHtml}</div>
        `;
        evacuationRoutes.appendChild(item);
    });

    // Mostrar resultados
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

    // Actualizar riesgo global
    document.querySelector('#globalRiskLevel strong').textContent = data.risk_level;
    
    // Ajustar barra de riesgo según el nivel
    let riskWidth = '50%'; // Moderado por defecto
    if (data.risk_level.includes('Alto')) riskWidth = '80%';
    if (data.risk_level.includes('Bajo')) riskWidth = '20%';
    
    document.getElementById('riskBar').style.width = riskWidth;
    
    // Mostrar datos técnicos en consola para depuración
    console.log('Datos técnicos del análisis:', data.technical_data);
}
