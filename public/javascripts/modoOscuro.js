document.addEventListener("DOMContentLoaded", () => {
    const rootEl = document.documentElement;
    const themeChannel = new BroadcastChannel('themeChange');

    // Detectar preferencia del sistema
    function aplicarTemaSegunSistema() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            rootEl.classList.add('invert');
        } else {
            rootEl.classList.remove('invert');
        }
    }

    // Aplicar el estado guardado en localStorage (si existe), si no, usar el sistema
    if (localStorage.getItem('theme') === 'invert') {
        rootEl.classList.add('invert');
    } else if (localStorage.getItem('theme') === 'normal') {
        rootEl.classList.remove('invert');
    } else {
        aplicarTemaSegunSistema();
    }

    // Escuchar cambios de modo oscuro desde `loby`
    themeChannel.onmessage = (event) => {
        if (event.data) {
            rootEl.classList.add('invert');
            localStorage.setItem('theme', 'invert');
        } else {
            rootEl.classList.remove('invert');
            localStorage.setItem('theme', 'normal');
        }
    };

    // Escuchar cambios de preferencia del sistema en tiempo real
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicarTemaSegunSistema);
});
