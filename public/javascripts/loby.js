const rootEl = document.documentElement

const themeInvertEl = document.querySelector('.invert__theme')

themeInvertEl.addEventListener('click', (e) => {
  rootEl.classList.toggle('invert')
})

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.btn-eliminar-proyecto').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.card');
      const idProyecto = card.getAttribute('data-id-proyecto');
      if (confirm('¿Seguro que deseas eliminar este proyecto?')) {
        fetch(`/proyectos/eliminar/${idProyecto}`, {
          method: 'DELETE'
        })
        .then(res => {
          if (res.ok) {
            card.remove();
          } else {
            alert('No se pudo eliminar el proyecto.');
          }
        });
      }
    });
  });
});