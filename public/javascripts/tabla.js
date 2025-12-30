// =====================
// Script de manejo de la tabla de registro de notas y filtros dinámicos
// =====================
document.addEventListener('DOMContentLoaded', function() {
    const idProyecto = document.querySelector('form#notasForm').action.split('/').pop();
    const tabla = document.querySelector('.tabla1 tbody');

    // =====================
    // Función: crearFilaVacia - Agrega una nueva fila vacía para un nuevo estudiante
    // =====================
    function crearFilaVacia() {
        // Buscar el último número de fila visible
        let lastNumber = 0;
        tabla.querySelectorAll('tr').forEach(tr => {
            const tdNum = tr.querySelector('td');
            if (tdNum && !isNaN(parseInt(tdNum.textContent))) {
                lastNumber = Math.max(lastNumber, parseInt(tdNum.textContent));
            }
        });
        const rowCount = lastNumber + 1;

        const nuevaFila = document.createElement('tr');
        nuevaFila.innerHTML = `
        <td style="text-align: center;">${rowCount}</td>
        <td><input type="text" name="apellido[]" value=""></td>
        <td><input type="text" name="nombre[]" value=""></td>
        <td><input type="text" name="cedula[]" value=""></td>
        <td>
            <select name="genero[]">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="N/D">N/D</option>
            </select>
        </td>
        <!-- Lapso 1, Actividad 1 -->
        <td class="lapso-col-1"><input type="number" name="nota1_1[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-1"></td>
        <td class="lapso-col-1"></td>
        <!-- Lapso 1, Actividad 2 -->
        <td class="lapso-col-1"><input type="number" name="nota1_2[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-1"></td>
        <td class="lapso-col-1"></td>
        <!-- Lapso 1, Actividad 3 -->
        <td class="lapso-col-1"><input type="number" name="nota1_3[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-1"></td>
        <td class="lapso-col-1"></td>
        <!-- Nota final y porcentaje obtenido Lapso 1 -->
        <td class="lapso-col-1"><input type="number" name="nota_final_lapso1" min="0" max="10" step="0.01"></td>
        <td class="lapso-col-1"><input type="number" name="porcentaje_obtenido_lapso1" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-1"></td>
        
        <!-- Lapso 2, Actividad 1 -->
        <td class="lapso-col-2"><input type="number" name="nota2_1[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-2"></td>
        <td class="lapso-col-2"></td>
        <!-- Lapso 2, Actividad 2 -->
        <td class="lapso-col-2"><input type="number" name="nota2_2[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-2"></td>
        <td class="lapso-col-2"></td>
        <!-- Lapso 2, Actividad 3 -->
        <td class="lapso-col-2"><input type="number" name="nota2_3[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-2"></td>
        <td class="lapso-col-2"></td>
        <!-- Nota final y porcentaje obtenido Lapso 2 -->
        <td class="lapso-col-2"><input type="number" name="nota_final_lapso2" min="0" max="10" step="0.01"></td>
        <td class="lapso-col-2"><input type="number" name="porcentaje_obtenido_lapso2" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-2"></td>
        <!-- Lapso 3, Actividad 1 -->
        <td class="lapso-col-3"><input type="number" name="nota3_1[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-3"></td>
        <td class="lapso-col-3"></td>
        <!-- Lapso 3, Actividad 2 -->
        <td class="lapso-col-3"><input type="number" name="nota3_2[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-3"></td>
        <td class="lapso-col-3"></td>
        <!-- Lapso 3, Actividad 3 -->
        <td class="lapso-col-3"><input type="number" name="nota3_3[]" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-3"></td>
        <td class="lapso-col-3"></td>
        <!-- Nota final y porcentaje obtenido Lapso 3 -->
        <td class="lapso-col-3"><input type="number" name="nota_final_lapso3" min="0" max="10" step="0.01"></td>
        <td class="lapso-col-3"><input type="number" name="porcentaje_obtenido_lapso3" min="0" max="100" step="0.01"></td>
        <td class="lapso-col-3"></td>
        <td><button type="button" class="eliminar" style="background: none; border: none; color: red; cursor: pointer;">Eliminar</button></td>
    `;
    tabla.appendChild(nuevaFila);
    agregarListenersUltimaFila();

    // Oculta las columnas de lapsos que no estén activas
    const lapsoActivo = document.querySelector('.lapso-toggle.active') 
        ? document.querySelector('.lapso-toggle.active').getAttribute('data-lapso') 
        : '1';
    for (let i = 1; i <= 3; i++) {
        nuevaFila.querySelectorAll('.lapso-col-' + i).forEach(td => {
            td.style.display = (i == lapsoActivo) ? '' : 'none';
        });
    }
}

    // =====================
    // Función: agregarListenersUltimaFila - Añade listeners a la última fila para crear nuevas filas automáticamente
    // =====================
    function agregarListenersUltimaFila() {
        const filas = tabla.querySelectorAll('tr');
        const ultimaFila = filas[filas.length - 1];
        const inputs = ultimaFila.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                const [apellido, nombre, cedula] = inputs;
                if (apellido.value.trim() && nombre.value.trim() && cedula.value.trim()) {
                    
                    if ([...tabla.querySelectorAll('tr')].every(fila => {
                        const tds = fila.querySelectorAll('input[type="text"]');
                        return !(tds[0] && tds[1] && tds[2] &&
                            tds[0].value.trim() === "" &&
                            tds[1].value.trim() === "" &&
                            tds[2].value.trim() === "");
                    })) {
                        crearFilaVacia();
                    }
                }
            });
        });
    }

    agregarListenersUltimaFila();

    // =====================
    // Función: actualizarResumen - Actualiza los totales del resumen de estudiantes
    // =====================
    function actualizarResumen() {
        let total = 0, masc = 0, fem = 0, aprob = 0, reprob = 0;
        document.querySelectorAll('.tabla1 tbody tr').forEach(tr => {
            const apellido = tr.querySelector('input[name="apellido[]"]');
            const nombre = tr.querySelector('input[name="nombre[]"]');
            const cedula = tr.querySelector('input[name="cedula[]"]');
            // Solo contar si los tres campos tienen valor
            if (
                tr.style.display !== 'none' &&
                apellido && nombre && cedula &&
                apellido.value.trim() !== "" &&
                nombre.value.trim() !== "" &&
                cedula.value.trim() !== ""
            ) {
                total++;
                const genero = tr.getAttribute('data-genero');
                const status = (tr.getAttribute('data-status')||'').toLowerCase();
                if (genero === 'M') masc++;
                if (genero === 'F') fem++;
                if (status === 'aprobado') aprob++;
                if (status === 'reprobado') reprob++;
            }
        });
        document.getElementById('total-estudiantes').textContent = total;
        document.getElementById('total-masculinos').textContent = masc;
        document.getElementById('total-femeninos').textContent = fem;
        document.getElementById('total-aprobados').textContent = aprob;
        document.getElementById('total-reprobados').textContent = reprob;
    }

    // =====================
    // Función: filtrarTabla - Filtra la tabla según el tipo seleccionado
    // =====================
    function filtrarTabla(tipo) {
        document.querySelectorAll('.tabla1 tbody tr').forEach(tr => {
            const apellido = tr.querySelector('input[name="apellido[]"]');
            const nombre = tr.querySelector('input[name="nombre[]"]');
            const cedula = tr.querySelector('input[name="cedula[]"]');
            // Solo filtrar si la fila tiene datos de estudiante
            if (
                !apellido || !nombre || !cedula ||
                apellido.value.trim() === "" ||
                nombre.value.trim() === "" ||
                cedula.value.trim() === ""
            ) {
                tr.style.display = 'table-row'; // Siempre mostrar la fila vacía
                return;
            }
            const genero = tr.getAttribute('data-genero');
            const status = (tr.getAttribute('data-status')||'').toLowerCase();
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
            tr.style.display = mostrar ? 'table-row' : 'none';
        });
        actualizarResumen();
    }

    // Eliminar estudiante with confirmación
    document.querySelectorAll('.btn-eliminar-fila').forEach(btn => {
        btn.addEventListener('click', function() {
            const idEstudiante = this.getAttribute('data-id-estudiante');
            if (confirm('¿Está seguro de que desea eliminar este estudiante?')) {
                fetch(`/registro/eliminar-estudiante/${idEstudiante}/${idProyecto}`, {
                    method: 'DELETE'
                })
                .then(res => {
                    if (res.ok) {
                        this.closest('tr').remove();
                    } else {
                        alert('No se pudo eliminar el estudiante.');
                    }
                });
            }
        });
    });

    // Filtros dinámicos
    const filtroBtns = document.querySelectorAll('.filtro-btn');
    const filas = document.querySelectorAll('.tabla1 tbody tr');
    filtroBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filtrarTabla(this.getAttribute('data-filtro'));
        });
    });
    // Inicializar resumen y mostrar todos
    filtrarTabla('todos');

    // Mostrar/ocultar columnas de lapsos (solo uno abierto a la vez, por defecto todos cerrados)
    function ocultarTodosLapsos() {
        for (let i = 1; i <= 3; i++) {
            // Oculta celdas de datos
            document.querySelectorAll('.lapso-col-' + i).forEach(td => {
                td.style.display = 'none';
            });
            // Oculta cabeceras
            document.querySelectorAll('th.lapso-col-' + i).forEach(th => {
                th.style.display = 'none';
            });
        }
    }
    function mostrarLapso(lapso) {
        ocultarTodosLapsos();
        // Muestra celdas de datos
        document.querySelectorAll('.lapso-col-' + lapso).forEach(td => {
            td.style.display = '';
        });
        // Muestra cabeceras
        document.querySelectorAll('th.lapso-col-' + lapso).forEach(th => {
            th.style.display = '';
        });
    }
    // Inicialmente todos cerrados, luego abre el primero
    ocultarTodosLapsos();
    mostrarLapso(1);

    function actualizarTituloLapso(lapso) {
    const titulo = document.getElementById('lapso-titulo');
    if (titulo) {
        titulo.textContent = 'Lapso ' + lapso;
    }
}

// Modifica el evento de los botones de lapso:
document.querySelectorAll('.lapso-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
        mostrarLapso(this.getAttribute('data-lapso'));
        actualizarTituloLapso(this.getAttribute('data-lapso'));
    });
});

// Al cargar la página, inicializa el título:
actualizarTituloLapso(1);

    // =====================
    // Cálculo automático de pts obtenidos y Nota Final Lapso para VARIAS evaluaciones por lapso
    // =====================
    function calcularCamposLapso(fila, lapso) {
        let sumaPuntajeObtenido = 0;
        let sumaPuntajeMaximo = 0;
        for (let idx = 1; idx <= 3; idx++) {
            const notaInput = fila.querySelector(`input[name="nota${lapso}_${idx}[]"]`);
            const puntajeInput = document.querySelector(`input[name="porcentaje${lapso}_${idx}"]`);
            const actividadInput = document.querySelector(`input[name="actividad${lapso}_${idx}"]`);
            if (!notaInput || !puntajeInput || !actividadInput) continue;

            let nota = notaInput.value.trim();
            let puntajeMax = puntajeInput.value.trim();
            let actividad = actividadInput.value.trim();

            if (nota !== '' && puntajeMax !== '' && actividad !== '') {
                let notaNum = parseFloat(nota) || 0;
                let puntajeNum = parseFloat(puntajeMax) || 0;
                let puntajeObtenido = (notaNum * puntajeNum) / 100;
                sumaPuntajeObtenido += puntajeObtenido;
                sumaPuntajeMaximo += puntajeNum;
            }
        }

        // Nota final del lapso es la suma de puntajes obtenidos (base 10)
        const notaFinalLapso = sumaPuntajeObtenido.toFixed(2);

        const notaFinalLapsoInput = fila.querySelector(`input[name="nota_final_lapso${lapso}"]`);
        if (notaFinalLapsoInput) notaFinalLapsoInput.value = notaFinalLapso;

        // Porcentaje obtenido
        const porcentajeObtenidoInput = fila.querySelector(`input[name="porcentaje_obtenido_lapso${lapso}"]`);
        let porcentajeObtenido = sumaPuntajeMaximo > 0 ? (sumaPuntajeObtenido / sumaPuntajeMaximo) * 100 : 0;
        if (porcentajeObtenidoInput) porcentajeObtenidoInput.value = porcentajeObtenido.toFixed(2);
    }

    function recalcularTodosLosLapsos() {
        document.querySelectorAll('.tabla1 tbody tr').forEach(fila => {
            for (let lapso = 1; lapso <= 3; lapso++) {
                calcularCamposLapso(fila, lapso);
            }
        });
    }

    // Listeners para recalcular al cambiar notas o porcentajes
    function agregarListenersCalculo() {
        document.querySelectorAll('.tabla1 tbody').forEach(tbody => {
            tbody.addEventListener('input', function(e) {
                // Detecta si es un input de nota o porcentaje de cualquier evaluación/lapso
                const name = e.target.name || '';
                const match = name.match(/^nota(\d+)_(\d+)\[\]$|^porcentaje(\d+)_(\d+)\[\]$/);
                if (match) {
                    const lapso = match[1] || match[3];
                    const fila = e.target.closest('tr');
                    calcularCamposLapso(fila, lapso);
                }
            });
        });
    }

    agregarListenersCalculo();
    recalcularTodosLosLapsos();

    // Validar nombres de actividades únicos antes de enviar el formulario
    const form = document.getElementById('notasForm');
    form.addEventListener('submit', function(e) {
        // Recolecta los nombres de actividades de la cabecera
        const actividades = [];
        for (let lapso = 1; lapso <= 3; lapso++) {
            for (let idx = 1; idx <= 3; idx++) {
                const input = form.querySelector(`input[name="actividad${lapso}_${idx}"]`);
                if (input && input.value.trim() !== '') {
                    actividades.push(input.value.trim().toLowerCase());
                }
            }
        }
        // Busca duplicados
        const actividadesSet = new Set(actividades);
        if (actividades.length !== actividadesSet.size) {
            alert('No puede haber dos actividades con el mismo nombre en la cabecera.');
            e.preventDefault();
            // Fuerza el redibujado de la tabla para que los nombres y columnas estén alineados
            recalcularTodosLosLapsos();
            return false;
        }
    });

    // Vaciar fila de notas
    document.querySelectorAll('.btn-vaciar-fila').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!confirm('¿Seguro que desea vaciar todas las notas de este estudiante en este proyecto?')) return;
            const fila = this.closest('tr');
            const idEstudiante = this.getAttribute('data-id-estudiante');
            // Llama a la API para vaciar notas en la base de datos
            fetch(`/registro/vaciar-notas-estudiante/${idEstudiante}/${idProyecto}`, {
                method: 'DELETE'
            })
            .then(res => {
                if (res.ok) {
                    // Vacía todos los inputs de notas de la fila en la interfaz
                    fila.querySelectorAll('input[type="number"]').forEach(input => {
                        input.value = '';
                    });
                } else {
                    alert('No se pudieron vaciar las notas del estudiante.');
                }
            });
        });
    });

    // Filtros dinámicos con select
const filtroSelect = document.getElementById('filtro-select');
if (filtroSelect) {
    filtroSelect.addEventListener('change', function() {
        filtrarTabla(this.value);
    });
    // Inicializar resumen y mostrar todos
    filtrarTabla(filtroSelect.value);
}

// Vincular el select de lapsos con la tabla
const lapsoSelect = document.getElementById('lapso-select');
if (lapsoSelect) {
    lapsoSelect.addEventListener('change', function() {
        mostrarLapso(this.value);
        actualizarTituloLapso(this.value);
    });
    // Inicializa mostrando el lapso seleccionado por defecto
    mostrarLapso(lapsoSelect.value);
    actualizarTituloLapso(lapsoSelect.value);
}
});