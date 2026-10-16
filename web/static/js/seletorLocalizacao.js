(() => {
    'use strict';

    const dialogo = document.getElementById('seletorLocalizacao');
    if (!dialogo) return;

    const campoLatitude = document.getElementById('latitude');
    const campoLongitude = document.getElementById('longitude');
    const campoRaio = document.getElementById('radius');
    const campoZoom = document.getElementById('zoom');
    const entradaRaio = document.getElementById('raioLocalizacao');
    const coordenadas = document.getElementById('coordenadasLocalizacao');
    const mensagem = document.getElementById('mensagemSeletorLocalizacao');
    const botaoAplicar = document.getElementById('aplicarLocalizacao');
    const botaoMarcarCentro = document.getElementById('marcarCentroLocalizacao');
    const botaoRecarregar = document.getElementById('recarregarMapaLocalizacao');
    let mapa;
    let marcador;
    let circulo;
    let marcadorRaio;
    let carregamento;

    function carregarLeaflet() {
        if (window.L) return Promise.resolve();
        if (carregamento) return carregamento;

        carregamento = new Promise((resolver, rejeitar) => {
            if (!document.getElementById('leaflet-css')) {
                const estilo = document.createElement('link');
                estilo.id = 'leaflet-css';
                estilo.rel = 'stylesheet';
                estilo.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
                document.head.appendChild(estilo);
            }
            let script = document.getElementById('leaflet-js');
            const novoScript = !script;
            if (novoScript) {
                script = document.createElement('script');
                script.id = 'leaflet-js';
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
            }
            script.addEventListener('load', resolver, { once: true });
            script.addEventListener('error', () => {
                script.remove();
                carregamento = null;
                rejeitar(new Error('Falha ao carregar Leaflet.'));
            }, { once: true });
            if (novoScript) document.head.appendChild(script);
        });
        return carregamento;
    }

    function obterRaio() {
        const raio = Number(entradaRaio.value);
        return Number.isFinite(raio) && raio >= 1 && Number.isInteger(raio) ? raio : null;
    }

    function pontoNaBorda(centro, raio) {
        const latitude = centro.lat * Math.PI / 180;
        const longitude = centro.lng * Math.PI / 180;
        const distanciaAngular = raio / L.CRS.Earth.R;
        const latitudeBorda = Math.asin(Math.sin(latitude) * Math.cos(distanciaAngular));
        const longitudeBorda = longitude + Math.atan2(
            Math.sin(distanciaAngular) * Math.cos(latitude),
            Math.cos(distanciaAngular) - Math.sin(latitude) * Math.sin(latitudeBorda)
        );
        return L.latLng(latitudeBorda * 180 / Math.PI, longitudeBorda * 180 / Math.PI).wrap();
    }

    function atualizarArea(moverBorda = true) {
        const raio = obterRaio();
        botaoAplicar.disabled = !marcador || raio === null;
        if (!marcador) return;
        const centro = marcador.getLatLng().wrap();
        coordenadas.textContent = `Latitude: ${window.coordenadasFormulario.formatarCoordenada(centro.lat, campoLatitude.value, 6)} · Longitude: ${window.coordenadasFormulario.formatarCoordenada(centro.lng, campoLongitude.value, 6)}`;
        if (raio === null) return;
        circulo.setLatLng(centro).setRadius(raio);
        if (moverBorda) marcadorRaio.setLatLng(pontoNaBorda(centro, raio));
    }

    function selecionarPonto(ponto) {
        const centro = ponto.wrap();
        const primeiraSelecao = !marcador;
        if (!marcador) {
            marcador = L.marker(centro, { draggable: true, title: 'Ponto central da busca', alt: 'Ponto central da busca' }).addTo(mapa);
            circulo = L.circle(centro, { radius: obterRaio() || 10000, color: '#344453', weight: 2, fillOpacity: 0.14 }).addTo(mapa);
            marcadorRaio = L.marker(centro, {
                draggable: true,
                title: 'Arraste para ajustar o raio',
                alt: 'Ajustar raio da busca',
                icon: L.divIcon({ className: 'marcador-raio', iconSize: [24, 24], iconAnchor: [12, 12] })
            }).addTo(mapa);
            marcador.on('drag', () => atualizarArea());
            marcadorRaio.on('drag', () => {
                entradaRaio.value = Math.max(1, Math.round(marcador.getLatLng().distanceTo(marcadorRaio.getLatLng())));
                atualizarArea(false);
            });
            marcadorRaio.on('dragend', () => atualizarArea());
        } else {
            marcador.setLatLng(centro);
        }
        atualizarArea();
        if (primeiraSelecao) {
            mapa.fitBounds(circulo.getBounds(), { padding: [40, 40], maxZoom: 16, animate: false });
        }
        mensagem.textContent = 'Arraste o ponto para movê-lo e o controle na borda para ajustar o raio.';
    }

    function limparSelecao() {
        [marcador, marcadorRaio, circulo].forEach((camada) => {
            if (camada) camada.remove();
        });
        marcador = null;
        marcadorRaio = null;
        circulo = null;
        coordenadas.textContent = 'Nenhum ponto selecionado.';
        botaoAplicar.disabled = true;
    }

    async function prepararMapa() {
        mensagem.textContent = 'Carregando mapa…';
        botaoRecarregar.hidden = true;
        botaoMarcarCentro.disabled = true;
        try {
            await carregarLeaflet();
            if (!dialogo.open) return;
            if (!mapa) {
                mapa = L.map('mapaLocalizacao', { minZoom: 2, maxZoom: 19, worldCopyJump: true, zoomControl: false });
                L.control.zoom({ zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(mapa);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(mapa);
                mapa.on('click', (evento) => selecionarPonto(evento.latlng));
            }
            limparSelecao();
            mapa.invalidateSize();
            const latitude = window.coordenadasFormulario.lerCoordenada(campoLatitude.value);
            const longitude = window.coordenadasFormulario.lerCoordenada(campoLongitude.value);
            const pontoValido = campoLatitude.value !== '' && campoLongitude.value !== ''
                && Number.isFinite(latitude) && Number.isFinite(longitude)
                && Math.abs(latitude) <= 85 && Math.abs(longitude) <= 180;
            if (pontoValido && (latitude !== 0 || longitude !== 0)) {
                mapa.setView([latitude, longitude], Math.min(19, Math.max(2, Number(campoZoom.value) || 15)), { animate: false });
                selecionarPonto(L.latLng(latitude, longitude));
            } else {
                mapa.setView([-14.2, -51.9], 4, { animate: false });
                mensagem.textContent = 'Clique no mapa ou marque o centro para escolher o ponto da busca.';
            }
            botaoMarcarCentro.disabled = false;
        } catch (erro) {
            botaoAplicar.disabled = true;
            console.warn('Não foi possível preparar o mapa de localização.', erro);
            mensagem.textContent = 'Não foi possível carregar o mapa. Confira sua conexão e tente novamente.';
            botaoRecarregar.hidden = false;
        }
    }

    document.getElementById('abrirSeletorLocalizacao').addEventListener('click', () => {
        entradaRaio.value = Number(campoRaio.value) > 0 ? campoRaio.value : '10000';
        botaoAplicar.disabled = true;
        dialogo.showModal();
        prepararMapa();
    });
    document.getElementById('fecharSeletorLocalizacao').addEventListener('click', () => dialogo.close());
    document.getElementById('cancelarSeletorLocalizacao').addEventListener('click', () => dialogo.close());
    botaoRecarregar.addEventListener('click', prepararMapa);
    botaoMarcarCentro.addEventListener('click', () => selecionarPonto(mapa.getCenter()));
    entradaRaio.addEventListener('input', () => atualizarArea());
    entradaRaio.addEventListener('change', () => {
        if (circulo && obterRaio() !== null) {
            mapa.fitBounds(circulo.getBounds(), { padding: [40, 40], maxZoom: 16, animate: false });
        }
    });
    botaoAplicar.addEventListener('click', () => {
        if (!marcador || obterRaio() === null) return;
        const ponto = marcador.getLatLng().wrap();
        campoLatitude.value = window.coordenadasFormulario.formatarCoordenada(ponto.lat, campoLatitude.value);
        campoLongitude.value = window.coordenadasFormulario.formatarCoordenada(ponto.lng, campoLongitude.value);
        campoRaio.value = String(obterRaio());
        campoZoom.value = String(mapa.getZoom());
        [campoLatitude, campoLongitude, campoRaio, campoZoom].forEach((campo) => {
            campo.dispatchEvent(new Event('change', { bubbles: true }));
        });
        dialogo.close();
    });
})();
