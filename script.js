const estado = {
  coordinaciones: {},
  categorias: [],
  docentes: [],
  turnos: [],
  clasesPorCarrera: {},
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

const adjuntarClasesForm = document.getElementById('adjuntarClasesForm');
const coordinacionAdjunta = document.getElementById('coordinacionAdjunta');
const carreraAdjunta = document.getElementById('carreraAdjunta');
const csvClases = document.getElementById('csvClases');
const listaClasesAdjuntas = document.getElementById('listaClasesAdjuntas');
const descargarPlantillaCsv = document.getElementById('descargarPlantillaCsv');

const generarHorarioForm = document.getElementById('generarHorarioForm');
const coordinacionPrincipal = document.getElementById('coordinacionPrincipal');
const carreraPrincipal = document.getElementById('carreraPrincipal');
const turnoPrincipal = document.getElementById('turnoPrincipal');
const listaHorarios = document.getElementById('listaHorarios');
const exportarHorarioCsv = document.getElementById('exportarHorarioCsv');

const resumen = document.getElementById('resumen');

function claveCarrera(coordinacion, carrera) {
  return `${coordinacion}::${carrera}`;
}

function minutosDesdeHora(horaTexto) {
  if (!horaTexto || !horaTexto.includes(':')) return 0;
  const [horas, minutos] = horaTexto.split(':').map(Number);
  return horas * 60 + minutos;
}

function horaDesdeMinutos(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60)
    .toString()
    .padStart(2, '0');
  const minutos = (totalMinutos % 60).toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

function descargarCSV(nombreArchivo, contenido) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

function llenarCoordinacionesPrincipal() {
  const coordinaciones = Object.keys(estado.coordinaciones);
  const opciones =
    '<option value="">Selecciona una coordinación</option>' +
    coordinaciones.map((coord) => `<option value="${coord}">${coord}</option>`).join('');

  coordinacionPrincipal.innerHTML = opciones;
  coordinacionAdjunta.innerHTML = opciones;
}

function llenarCarrerasPrincipal() {
  const coord = coordinacionPrincipal.value;
  const carreras = estado.coordinaciones[coord] || [];
  carreraPrincipal.innerHTML =
    '<option value="">Selecciona una carrera</option>' +
    carreras.map((carrera) => `<option value="${carrera}">${carrera}</option>`).join('');
}

function llenarCarrerasAdjunta() {
  const coord = coordinacionAdjunta.value;
  const carreras = estado.coordinaciones[coord] || [];
  carreraAdjunta.innerHTML =
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
      <span>Inicio: ${turno.horaInicio} | ${turno.minutosBloque} min/bloque | ${turno.creditosBloque} crédito(s)/bloque</span>
      <span>Receso: ${turno.horaReceso} | Almuerzo: ${turno.horaAlmuerzo}</span>
    </li>`
    )
    .join('');
}

function renderClasesAdjuntas() {
  const entradas = Object.entries(estado.clasesPorCarrera);
  if (!entradas.length) {
    listaClasesAdjuntas.innerHTML = '<li><span>Aún no hay CSV adjuntos por carrera.</span></li>';
    return;
  }

  listaClasesAdjuntas.innerHTML = entradas
    .map(([clave, clases]) => {
      const [coordinacion, carrera] = clave.split('::');
      const anios = [...new Set(clases.map((clase) => clase.anio))].filter(Boolean);
      return `<li><strong>${coordinacion} / ${carrera}</strong><span>${clases.length} clase(s) adjunta(s) | Años: ${anios.join(', ') || 'N/D'}</span></li>`;
    })
    .join('');
}

function renderHorarios(generacion) {
  if (!generacion || !generacion.horarioPorAnio.length) {
    listaHorarios.innerHTML = '<li><span>No se pudo generar horario para la selección actual.</span></li>';
    return;
  }

  listaHorarios.innerHTML = generacion.horarioPorAnio
    .map(({ anio, bloques }) => {
      const detalle = bloques
        .map(
          (bloque) =>
            `${bloque.dia} ${bloque.inicio}-${bloque.fin}: ${bloque.clase} (${bloque.creditos} cr) [${bloque.categorias}]`
        )
        .join(' · ');
      return `<li><strong>Año ${anio}</strong><span>${detalle}</span></li>`;
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
    <strong>Carreras con CSV adjunto:</strong> ${Object.keys(estado.clasesPorCarrera).length}<br>
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
      return { dia, prioridad: Number(prioridad) || 999 };
    });
}

function parseLineaCSV(linea) {
  const separador = linea.includes(';') ? ';' : ',';
  const columnas = [];
  let actual = '';
  let enComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const char = linea[i];

    if (char === '"') {
      if (enComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        enComillas = !enComillas;
      }
      continue;
    }

    if (char === separador && !enComillas) {
      columnas.push(actual.trim());
      actual = '';
      continue;
    }

    actual += char;
  }

  columnas.push(actual.trim());
  return columnas;
}

function parseCSV(texto) {
  const lineas = texto
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);

  if (!lineas.length) return { clases: [], error: 'El CSV está vacío.' };

  const normalizar = (textoValor) =>
    textoValor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const encabezados = parseLineaCSV(lineas[0]).map((h) => normalizar(h));
  const indices = {
    clase: encabezados.indexOf('clase'),
    anio: encabezados.indexOf('anio'),
    creditos: encabezados.indexOf('creditos'),
    categorias: encabezados.indexOf('categorias'),
    compartida: encabezados.indexOf('compartida'),
  };

  const faltantes = Object.entries(indices)
    .filter(([campo, indice]) => campo !== 'compartida' && indice < 0)
    .map(([campo]) => campo);

  if (faltantes.length) {
    return { clases: [], error: `Faltan columnas obligatorias: ${faltantes.join(', ')}` };
  }

  const clases = lineas.slice(1).map((linea) => {
    const columnas = parseLineaCSV(linea);
    return {
      clase: columnas[indices.clase] || '',
      anio: columnas[indices.anio] || '',
      creditos: Number(columnas[indices.creditos] || 0),
      categorias: columnas[indices.categorias] || 'General',
      compartida: indices.compartida >= 0 ? columnas[indices.compartida] || 'No' : 'No',
    };
  });

  const clasesValidas = clases.filter((clase) => clase.clase && clase.anio && clase.creditos > 0);

  if (!clasesValidas.length) {
    return { clases: [], error: 'No hay filas válidas (clase, año y créditos > 0).' };
  }

  return { clases: clasesValidas, error: '' };
}

function calcularHorarioPorAnio(clases, turno) {
  const prioridades = new Map(turno.prioridades.map((item) => [item.dia, item.prioridad]));
  const diasOrdenados = [...turno.dias].sort((a, b) => (prioridades.get(a) || 999) - (prioridades.get(b) || 999));

  const recesoInicio = minutosDesdeHora(turno.horaReceso);
  const recesoFin = recesoInicio + turno.duracionReceso;
  const almuerzoInicio = minutosDesdeHora(turno.horaAlmuerzo);
  const almuerzoFin = almuerzoInicio + turno.duracionAlmuerzo;

  const clasesPorAnio = clases.reduce((acc, clase) => {
    if (!acc[clase.anio]) acc[clase.anio] = [];
    acc[clase.anio].push(clase);
    return acc;
  }, {});

  return Object.entries(clasesPorAnio).map(([anio, clasesAnio]) => {
    const cursoresPorDia = Object.fromEntries(diasOrdenados.map((dia) => [dia, minutosDesdeHora(turno.horaInicio)]));
    const bloques = [];

    clasesAnio.forEach((clase, indiceClase) => {
      const dia = diasOrdenados[indiceClase % diasOrdenados.length];
      let cursor = cursoresPorDia[dia];
      const bloquesNecesarios = Math.max(1, Math.ceil(clase.creditos / turno.creditosBloque));

      for (let i = 0; i < bloquesNecesarios; i += 1) {
        const finTentativo = cursor + turno.minutosBloque;
        const cruzaReceso = cursor < recesoFin && finTentativo > recesoInicio;
        const cruzaAlmuerzo = cursor < almuerzoFin && finTentativo > almuerzoInicio;

        if (cruzaReceso) {
          cursor = recesoFin;
        }

        if (cruzaAlmuerzo) {
          cursor = almuerzoFin;
        }

        const inicio = cursor;
        const fin = cursor + turno.minutosBloque;

        bloques.push({
          dia,
          inicio: horaDesdeMinutos(inicio),
          fin: horaDesdeMinutos(fin),
          clase: clase.clase,
          creditos: clase.creditos,
          categorias: clase.categorias,
        });

        cursor = fin;
      }

      cursoresPorDia[dia] = cursor;
    });

    return { anio, bloques };
  });
}

function mostrarError(texto) {
  listaHorarios.innerHTML = `<li><span class="error-msg">${texto}</span></li>`;
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
  llenarCarrerasAdjunta();
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
    horaInicio: document.getElementById('horaInicio').value,
    minutosBloque: Number(document.getElementById('minutosBloque').value),
    creditosBloque: Number(document.getElementById('creditosBloque').value),
    horaReceso: document.getElementById('horaReceso').value,
    duracionReceso: Number(document.getElementById('duracionReceso').value),
    horaAlmuerzo: document.getElementById('horaAlmuerzo').value,
    duracionAlmuerzo: Number(document.getElementById('duracionAlmuerzo').value),
  };

  if (!turno.horaInicio || !turno.horaReceso || !turno.horaAlmuerzo) {
    return;
  }

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
coordinacionAdjunta.addEventListener('change', llenarCarrerasAdjunta);

adjuntarClasesForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const archivo = csvClases.files[0];
  const coordinacion = coordinacionAdjunta.value;
  const carrera = carreraAdjunta.value;

  if (!archivo || !coordinacion || !carrera) return;

  const contenido = await archivo.text();
  const { clases, error } = parseCSV(contenido);

  if (error) {
    mostrarError(`CSV inválido: ${error}`);
    return;
  }

  estado.clasesPorCarrera[claveCarrera(coordinacion, carrera)] = clases;
  adjuntarClasesForm.reset();
  renderClasesAdjuntas();
  renderResumen();
});

generarHorarioForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const coordinacion = coordinacionPrincipal.value;
  const carrera = carreraPrincipal.value;
  const nombreTurno = turnoPrincipal.value;
  const turno = estado.turnos.find((item) => item.nombre === nombreTurno);
  const clases = estado.clasesPorCarrera[claveCarrera(coordinacion, carrera)] || [];

  if (!coordinacion || !carrera || !nombreTurno || !turno) {
    mostrarError('Completa coordinación, carrera y turno para generar el horario.');
    return;
  }

  if (!clases.length) {
    mostrarError('Esta carrera no tiene un CSV adjunto. Adjunta las clases primero.');
    return;
  }

  const horarioPorAnio = calcularHorarioPorAnio(clases, turno);

  estado.ultimaGeneracion = {
    coordinacion,
    carrera,
    turno: nombreTurno,
    horarioPorAnio,
  };

  renderHorarios(estado.ultimaGeneracion);
  exportarHorarioCsv.disabled = false;
  renderResumen();
});

descargarPlantillaCsv.addEventListener('click', () => {
  const plantilla =
    'clase,año,créditos,categorías,compartida\n' +
    'Cálculo I,1,4,Matemática,No\n' +
    'Programación I,1,5,Programación,No\n' +
    'Física General,1,4,Ciencias,Sí';
  descargarCSV('plantilla_clases.csv', plantilla);
});

exportarHorarioCsv.addEventListener('click', () => {
  if (!estado.ultimaGeneracion || !estado.ultimaGeneracion.horarioPorAnio.length) return;

  const filas = ['año,día,inicio,fin,clase,créditos,categorías'];

  estado.ultimaGeneracion.horarioPorAnio.forEach(({ anio, bloques }) => {
    bloques.forEach((bloque) => {
      filas.push(
        [anio, bloque.dia, bloque.inicio, bloque.fin, bloque.clase, bloque.creditos, bloque.categorias]
          .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
          .join(',')
      );
    });
  });

  const nombre = `horario_${estado.ultimaGeneracion.carrera}_${estado.ultimaGeneracion.turno}.csv`;
  descargarCSV(nombre, filas.join('\n'));
});

renderClasesAdjuntas();
renderResumen();
