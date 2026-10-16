(() => {
    'use strict';

    const formulario = document.getElementById('formularioBusca');
    if (!formulario) return;

    const chaveArmazenamento = 'scraper.configuracoesBusca.v1';
    const campos = formulario.querySelectorAll('input[name], textarea[name], select[name]');

    function restaurarConfiguracoes() {
        try {
            const configuracoes = JSON.parse(localStorage.getItem(chaveArmazenamento));
            if (!configuracoes || typeof configuracoes !== 'object' || Array.isArray(configuracoes)) return;

            campos.forEach((campo) => {
                if (!Object.prototype.hasOwnProperty.call(configuracoes, campo.name)) return;
                const valor = configuracoes[campo.name];
                if (campo.type === 'checkbox') {
                    if (typeof valor === 'boolean') campo.checked = valor;
                } else if (typeof valor === 'string') {
                    campo.value = valor;
                }
            });
        } catch (erro) {
            console.warn('Não foi possível restaurar as configurações da busca.', erro);
        }
    }

    function salvarConfiguracoes() {
        const configuracoes = {};
        campos.forEach((campo) => {
            configuracoes[campo.name] = campo.type === 'checkbox' ? campo.checked : campo.value;
        });

        try {
            localStorage.setItem(chaveArmazenamento, JSON.stringify(configuracoes));
        } catch (erro) {
            console.warn('Não foi possível salvar as configurações da busca.', erro);
        }
    }

    restaurarConfiguracoes();
    formulario.addEventListener('htmx:beforeRequest', salvarConfiguracoes);
})();
