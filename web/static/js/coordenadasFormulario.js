(() => {
    'use strict';

    function lerCoordenada(valor) {
        const texto = valor.trim();
        if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(texto)) return NaN;
        return Number(texto.replace(',', '.'));
    }

    function formatarCoordenada(valor, referencia, casas = 8) {
        const texto = valor.toFixed(casas);
        return referencia.includes(',') ? texto.replace('.', ',') : texto;
    }

    window.coordenadasFormulario = { lerCoordenada, formatarCoordenada };

    const formulario = document.getElementById('formularioBusca');
    if (!formulario) return;
    const campos = [document.getElementById('latitude'), document.getElementById('longitude')];

    function validarCampo(campo) {
        const valor = lerCoordenada(campo.value);
        const limite = campo.name === 'latitude' ? 90 : 180;
        const valido = campo.value.trim() === '' || (Number.isFinite(valor) && Math.abs(valor) <= limite);
        campo.setCustomValidity(valido ? '' : `Informe uma coordenada entre -${limite} e ${limite}, usando ponto ou vírgula.`);
        return valido;
    }

    campos.forEach((campo) => {
        campo.addEventListener('input', () => validarCampo(campo));
        campo.addEventListener('change', () => validarCampo(campo));
    });
    formulario.addEventListener('htmx:configRequest', (evento) => {
        const validos = campos.map(validarCampo);
        if (validos.includes(false)) {
            evento.preventDefault();
            campos.find((campo) => !campo.validity.valid).reportValidity();
            return;
        }
        campos.forEach((campo) => {
            evento.detail.parameters[campo.name] = campo.value.trim() === '' ? '' : String(lerCoordenada(campo.value));
        });
    });
})();
