const estado = {
  coordinaciones: {},
  categorias: [],
  docentes: [],
  turnos: [],
  ultimaGeneracion: null,
};

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

const generalForm = document.getElementById('generalForm');
const nombreCoordinacion = document.getElementById('nombreCoordinacion');
const carrerasCoordinacion = document.getElementById('carrerasCoordinacion');
const listaCoordinaciones = document.getElementById('listaCoordinaciones');

const categoriaForm = document.getElementById('categoriaForm');
const nombreCategoria = document.getElementById('nombreCategoria');
const listaCategorias = document.getElementById('listaCategorias');

const docenteForm = document.getElementById('docenteForm');
const nombreDocente = document.getElementById('nombreDocente');
const categoriasDocente = document.getElementById('categoriasDocente');
const listaDocentes = document.getElementById('listaDocentes');

const turnoForm = document.getElementById('turnoForm');
const listaTurnos = document.getElementById('listaTurnos');

const matriculaCargaForm = document.getElementById('matriculaCargaForm');
const coordinacionPrincipal = document.getElementById('coordinacionPrincipal');
const carreraPrincipal = document.getElementById('carreraPrincipal');
const turnoPrincipal = document.getElementById('turnoPrincipal');
const csvClases = document.getElementById('csvClases');
const listaHorarios = document.getElementById('listaHorarios');

const resumen = document.getElementById('resumen');

function llenarCoordinacionesPrincipal() {
  const coordinaciones = Object.keys(estado.coordinaciones);
  coordinacionPrincipal.innerHTML =
    '<option value="">Selecciona una coordinación</option>' +
    coordinaciones.map((coord) => `<option value="${coord}">${coord}</option>`).join('');
}

function llenarCarrerasPrincipal() {
  const coord = coordinacionPrincipal.value;
  const carreras = estado.coordinaciones[coord] || [];
  carreraPrincipal.innerHTML =
    '<option value="">Selecciona una carrera</option>' +
    carreras.map((carrera) => `<option value="${carrera}">${carrera}</option>`).join('');
}

function llenarTurnosPrincipal() {
  turnoPrincipal.innerHTML =
    '<option value="">Selecciona un turno</option>' +
    estado.turnos.map((turno) => `<option value="${turno.nombre}">${turno.nombre}</option>`).join('');
}

function llenarCategoriasDocente() {
  categoriasDocente.innerHTML = estado.categorias
    .map((categoria) => `<option value="${categoria}">${categoria}</option>`)
    .join('');
}

function renderCoordinaciones() {
  listaCoordinaciones.innerHTML = Object.entries(estado.coordinaciones)
    .map(
      ([coordinacion, carreras]) =>
        `<li><strong>${coordinacion}</strong><span>Carreras: ${carreras.join(', ')}</span></li>`
    )
    .join('');
}

function renderCategorias() {
  listaCategorias.innerHTML = estado.categorias
    .map((categoria) => `<li><strong>${categoria}</strong></li>`)
    .join('');
}

function renderDocentes() {
  listaDocentes.innerHTML = estado.docentes
    .map(
      (docente) =>
        `<li><strong>${docente.nombre}</strong><span>Categorías: ${docente.categorias.join(', ')}</span></li>`
    )
    .join('');
}

function renderTurnos() {
  listaTurnos.innerHTML = estado.turnos
    .map(
      (turno) => `<li>
      <strong>${turno.nombre}</strong>
      <span>Días: ${turno.dias.join(', ')}</span>
      <span>Prioridad: ${turno.prioridadTexto}</span>
      <span>${turno.minutosBloque} min/bloque | ${turno.creditosBloque} crédito(s)/bloque</span>
      <span>Receso: ${turno.horaReceso} | Almuerzo: ${turno.horaAlmuerzo}</span>
    </li>`
    )
    .join('');
}

function renderHorarios(generacion) {
  const porAnio = generacion.clases.reduce((acc, clase) => {
    if (!acc[clase.anio]) acc[clase.anio] = [];
    acc[clase.anio].push(clase);
    return acc;
  }, {});

  listaHorarios.innerHTML = Object.entries(porAnio)
    .map(([anio, clases]) => {
      const clasesTexto = clases
        .map((clase) => `${clase.clase} [${clase.creditos} créditos | ${clase.categorias}]`)
        .join(' · ');

      return `<li><strong>Año ${anio}</strong><span>${clasesTexto}</span></li>`;
    })
    .join('');
}

function renderResumen() {
  resumen.classList.remove('vacío');
  const totalCarreras = Object.values(estado.coordinaciones).reduce((acc, carreras) => acc + carreras.length, 0);

  resumen.innerHTML = `
    <strong>Coordinaciones configuradas:</strong> ${Object.keys(estado.coordinaciones).length}<br>
    <strong>Carreras configuradas:</strong> ${totalCarreras}<br>
    <strong>Categorías registradas:</strong> ${estado.categorias.length}<br>
    <strong>Docentes registrados:</strong> ${estado.docentes.length}<br>
    <strong>Turnos integrados:</strong> ${estado.turnos.length}<br>
    <strong>Última generación:</strong> ${estado.ultimaGeneracion ? `${estado.ultimaGeneracion.coordinacion} / ${estado.ultimaGeneracion.carrera} / ${estado.ultimaGeneracion.turno}` : 'Sin ejecutar'}
  `;
}

function parsePrioridades(texto) {
  return texto
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [dia, prioridad] = item.split(':').map((parte) => parte.trim());
      return { dia, prioridad: Number(prioridad) };
    });
}

function parseCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(Boolean);
  if (!lineas.length) return [];

  const encabezados = lineas[0].split(',').map((h) => h.trim().toLowerCase());
  const indices = {
    clase: encabezados.indexOf('clase'),
    anio: encabezados.indexOf('año') >= 0 ? encabezados.indexOf('año') : encabezados.indexOf('anio'),
    creditos: encabezados.indexOf('créditos') >= 0 ? encabezados.indexOf('créditos') : encabezados.indexOf('creditos'),
    categorias: encabezados.indexOf('categorías') >= 0 ? encabezados.indexOf('categorías') : encabezados.indexOf('categorias'),
    compartida: encabezados.indexOf('compartida'),
  };

  return lineas.slice(1).map((linea) => {
    const columnas = linea.split(',').map((col) => col.trim());
    return {
      clase: columnas[indices.clase] || '',
      anio: columnas[indices.anio] || '',
      creditos: Number(columnas[indices.creditos] || 0),
      categorias: columnas[indices.categorias] || '',
      compartida: columnas[indices.compartida] || 'No',
    };
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const tabId = button.dataset.tab;
    tabButtons.forEach((btn) => btn.classList.remove('active'));
    tabPanels.forEach((panel) => panel.classList.remove('active'));

    button.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
  });
});

generalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const coordinacion = nombreCoordinacion.value.trim();
  const carreras = carrerasCoordinacion.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!coordinacion || !carreras.length) return;

  estado.coordinaciones[coordinacion] = carreras;
  generalForm.reset();
  renderCoordinaciones();
  llenarCoordinacionesPrincipal();
  llenarCarrerasPrincipal();
  renderResumen();
});

categoriaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const categoria = nombreCategoria.value.trim();

  if (categoria && !estado.categorias.includes(categoria)) {
    estado.categorias.push(categoria);
  }

  categoriaForm.reset();
  renderCategorias();
  llenarCategoriasDocente();
  renderResumen();
});

docenteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nombre = nombreDocente.value.trim();
  const categoriasSeleccionadas = Array.from(categoriasDocente.selectedOptions).map((option) => option.value);

  if (!nombre || !categoriasSeleccionadas.length) return;

  estado.docentes.push({ nombre, categorias: categoriasSeleccionadas });
  docenteForm.reset();
  renderDocentes();
  renderResumen();
});

turnoForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nombre = document.getElementById('nombreTurno').value.trim();
  const dias = document
    .getElementById('diasTurno')
    .value.split(',')
    .map((dia) => dia.trim())
    .filter(Boolean);
  const prioridadTexto = document.getElementById('prioridadDias').value.trim();

  const turno = {
    nombre,
    dias,
    prioridadTexto,
    prioridades: parsePrioridades(prioridadTexto),
    minutosBloque: Number(document.getElementById('minutosBloque').value),
    creditosBloque: Number(document.getElementById('creditosBloque').value),
    horaReceso: document.getElementById('horaReceso').value,
    horaAlmuerzo: document.getElementById('horaAlmuerzo').value,
  };

  const indiceExistente = estado.turnos.findIndex((item) => item.nombre === nombre);
  if (indiceExistente >= 0) {
    estado.turnos[indiceExistente] = turno;
  } else {
    estado.turnos.push(turno);
  }

  turnoForm.reset();
  renderTurnos();
  llenarTurnosPrincipal();
  renderResumen();
});

coordinacionPrincipal.addEventListener('change', llenarCarrerasPrincipal);

matriculaCargaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const archivo = csvClases.files[0];
  if (!archivo) return;

  const contenido = await archivo.text();
  const clases = parseCSV(contenido);

  estado.ultimaGeneracion = {
    coordinacion: coordinacionPrincipal.value,
    carrera: carreraPrincipal.value,
    turno: turnoPrincipal.value,
    clases,
  };

  renderHorarios(estado.ultimaGeneracion);
  renderResumen();
});

renderResumen();
