document.addEventListener('DOMContentLoaded', function() {
    const filtroSelect = document.getElementById('filtro-imprimir-select');
    const filas = document.querySelectorAll('table tbody tr');

    function filtrarTabla(tipo) {
        filas.forEach(tr => {
            const genero = tr.getAttribute('data-genero');
            const status = (tr.getAttribute('data-status') || '').toLowerCase();
            let mostrar = true;
            switch(tipo) {
                case 'masculino-aprobado': mostrar = genero === 'M' && status === 'aprobado'; break;
                case 'masculino-reprobado': mostrar = genero === 'M' && status === 'reprobado'; break;
                case 'femenino-aprobado': mostrar = genero === 'F' && status === 'aprobado'; break;
                case 'femenino-reprobado': mostrar = genero === 'F' && status === 'reprobado'; break;
                case 'aprobado': mostrar = status === 'aprobado'; break;
                case 'reprobado': mostrar = status === 'reprobado'; break;
                case 'masculino': mostrar = genero === 'M'; break;
                case 'femenino': mostrar = genero === 'F'; break;
                case 'todos': default: mostrar = true; break;
            }
            tr.style.display = mostrar ? '' : 'none';
        });
    }

    if (filtroSelect) {
        filtroSelect.addEventListener('change', function() {
            filtrarTabla(this.value);
        });
        filtrarTabla(filtroSelect.value);
    }
});