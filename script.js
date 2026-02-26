const estado = {
  coordinaciones: {},
  categorias: [],
  docentes: [],
  turnos: [],
  periodosPorTurno: {},
  clasesPorCarrera: {},
  horariosGenerados: {},
  vistaActual: null,
};

const ANIOS_BASE = ['1', '2', '3', '4', '5'];
const PRIORIDAD_DEFAULT = 'Lunes:1,Martes:2,Miércoles:3,Jueves:4,Viernes:5';

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

const generalForm = document.getElementById('generalForm');
const categoriaForm = document.getElementById('categoriaForm');
const docenteForm = document.getElementById('docenteForm');
const turnoForm = document.getElementById('turnoForm');
const periodoForm = document.getElementById('periodoForm');
const adjuntarClasesForm = document.getElementById('adjuntarClasesForm');
const generarHorarioForm = document.getElementById('generarHorarioForm');
const claseManualForm = document.getElementById('claseManualForm');

const coordinacionPrincipal = document.getElementById('coordinacionPrincipal');
const carreraPrincipal = document.getElementById('carreraPrincipal');
const turnoPrincipal = document.getElementById('turnoPrincipal');
const periodoPrincipal = document.getElementById('periodoPrincipal');

const coordinacionAdjunta = document.getElementById('coordinacionAdjunta');
const carreraAdjunta = document.getElementById('carreraAdjunta');
const csvClases = document.getElementById('csvClases');
const estadoCsvUpload = document.getElementById('estadoCsvUpload');

const filtroCoordinacion = document.getElementById('filtroCoordinacion');
const filtroCarrera = document.getElementById('filtroCarrera');
const filtroTurno = document.getElementById('filtroTurno');

const listaCoordinaciones = document.getElementById('listaCoordinaciones');
const listaCategorias = document.getElementById('listaCategorias');
const listaDocentes = document.getElementById('listaDocentes');
const listaTurnos = document.getElementById('listaTurnos');
const listaPeriodos = document.getElementById('listaPeriodos');
const listaClasesAdjuntas = document.getElementById('listaClasesAdjuntas');
const listaHorarios = document.getElementById('listaHorarios');
const resumen = document.getElementById('resumen');

const descargarPlantillaCsv = document.getElementById('descargarPlantillaCsv');
const exportarHorarioCsv = document.getElementById('exportarHorarioCsv');
const verHorarioFiltrado = document.getElementById('verHorarioFiltrado');
const reiniciarHorarios = document.getElementById('reiniciarHorarios');
const estadoClaseManual = document.getElementById('estadoClaseManual');
const turnoPeriodo = document.getElementById('turnoPeriodo');

function claveCarrera(coordinacion, carrera) {
  return `${coordinacion}::${carrera}`;
}

function claveHorario(coordinacion, carrera, turno, periodo) {
  return `${coordinacion}::${carrera}::${turno}::${periodo}`;
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

function parsePrioridades(texto, dias) {
  const fuente = texto?.trim() ? texto : PRIORIDAD_DEFAULT;
  const prioridades = fuente
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [dia, prioridad] = item.split(':').map((parte) => parte.trim());
      return { dia, prioridad: Number(prioridad) || 999 };
    });

  if (!dias.length) return prioridades;
  const mapeadas = new Map(prioridades.map((p) => [p.dia, p.prioridad]));
  return dias.map((dia, idx) => ({ dia, prioridad: mapeadas.get(dia) || idx + 1 }));
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

  const normalizar = (valor) =>
    valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const encabezados = parseLineaCSV(lineas[0]).map((h) => normalizar(h));
  const indiceDesdeOpciones = (...opciones) => encabezados.findIndex((header) => opciones.includes(header));
  const indices = {
    clase: indiceDesdeOpciones('clase'),
    anio: indiceDesdeOpciones('anio', 'ano'),
    creditos: indiceDesdeOpciones('creditos', 'credito'),
    categorias: indiceDesdeOpciones('categorias', 'categoria'),
    compartida: indiceDesdeOpciones('compartida'),
    tipo: indiceDesdeOpciones('tipo'),
  };

  const faltantes = Object.entries(indices)
    .filter(([campo, idx]) => campo !== 'compartida' && idx < 0)
    .map(([campo]) => campo);
  if (faltantes.length) return { clases: [], error: `Faltan columnas: ${faltantes.join(', ')}` };

  const clases = lineas.slice(1).map((linea) => {
    const columnas = parseLineaCSV(linea);
    return {
      clase: columnas[indices.clase] || '',
      anio: String(columnas[indices.anio] || '').trim(),
      creditos: Number(columnas[indices.creditos] || 0),
      categorias: columnas[indices.categorias] || 'General',
      compartida: indices.compartida >= 0 ? columnas[indices.compartida] || 'No' : 'No',
      tipo: indices.tipo >= 0 ? columnas[indices.tipo] || 'Aula' : 'Aula',
      origen: 'csv',
    };
  });

  const clasesValidas = clases.filter((clase) => clase.clase && clase.anio && clase.creditos > 0);
  if (!clasesValidas.length) return { clases: [], error: 'No hay filas válidas.' };
  return { clases: clasesValidas, error: '' };
}

function renderCoordinaciones() {
  listaCoordinaciones.innerHTML = Object.entries(estado.coordinaciones)
    .map(([coordinacion, carreras]) => `<li><strong>${coordinacion}</strong><span>${carreras.join(', ')}</span></li>`)
    .join('');
}

function renderCategorias() {
  listaCategorias.innerHTML = estado.categorias.map((categoria) => `<li><strong>${categoria}</strong></li>`).join('');
}

function renderDocentes() {
  listaDocentes.innerHTML = estado.docentes
    .map((docente) => `<li><strong>${docente.nombre}</strong><span>${docente.categorias.join(', ')}</span></li>`)
    .join('');
}

function renderTurnos() {
  listaTurnos.innerHTML = estado.turnos
    .map(
      (turno) => `<li><strong>${turno.nombre}</strong><span>Días: ${turno.dias.join(', ')}</span><span>Prioridad: ${turno.prioridadTexto}</span><span>Inicio: ${turno.horaInicio}</span></li>`
    )
    .join('');
}

function renderPeriodos() {
  const items = Object.entries(estado.periodosPorTurno).flatMap(([turno, periodos]) =>
    periodos.map(
      (periodo) =>
        `<li><strong>${turno}</strong><span>${periodo}</span><button type="button" class="btn-eliminar-periodo" data-turno="${turno}" data-periodo="${periodo}">Eliminar</button></li>`
    )
  );
  listaPeriodos.innerHTML = items.join('') || '<li><span>No hay periodos configurados.</span></li>';
}

function renderClasesAdjuntas() {
  const entradas = Object.entries(estado.clasesPorCarrera);
  listaClasesAdjuntas.innerHTML =
    entradas
      .map(([clave, clases]) => {
        const [coordinacion, carrera] = clave.split('::');
        const aniosCsv = [...new Set(clases.filter((c) => c.origen === 'csv').map((c) => c.anio))].sort();
        return `<li><strong>${coordinacion} / ${carrera}</strong><span>${clases.length} clase(s). Años CSV: ${aniosCsv.join(', ') || 'ninguno'}</span></li>`;
      })
      .join('') || '<li><span>Aún no hay clases adjuntas.</span></li>';
}

function renderResumen() {
  resumen.classList.remove('vacío');
  const totalCarreras = Object.values(estado.coordinaciones).reduce((acc, carreras) => acc + carreras.length, 0);
  resumen.innerHTML = `<strong>Coordinaciones:</strong> ${Object.keys(estado.coordinaciones).length}<br>
  <strong>Carreras:</strong> ${totalCarreras}<br>
  <strong>Turnos:</strong> ${estado.turnos.length}<br>
  <strong>Periodos:</strong> ${Object.values(estado.periodosPorTurno).reduce((a, b) => a + b.length, 0)}<br>
  <strong>Carreras con clases:</strong> ${Object.keys(estado.clasesPorCarrera).length}<br>
  <strong>Horarios generados:</strong> ${Object.keys(estado.horariosGenerados).length}`;
}

function mostrarError(texto) {
  listaHorarios.innerHTML = `<li><span class="error-msg">${texto}</span></li>`;
}

function llenarCoordinaciones() {
  const options =
    '<option value="">Selecciona una coordinación</option>' +
    Object.keys(estado.coordinaciones)
      .map((coord) => `<option value="${coord}">${coord}</option>`)
      .join('');
  [coordinacionPrincipal, coordinacionAdjunta, filtroCoordinacion].forEach((el) => {
    el.innerHTML = options;
  });
}

function llenarCarreras(selectCoord, selectCarrera) {
  const carreras = estado.coordinaciones[selectCoord.value] || [];
  selectCarrera.innerHTML =
    '<option value="">Selecciona una carrera</option>' +
    carreras.map((carrera) => `<option value="${carrera}">${carrera}</option>`).join('');
}

function llenarTurnos() {
  const options =
    '<option value="">Selecciona un turno</option>' +
    estado.turnos.map((turno) => `<option value="${turno.nombre}">${turno.nombre}</option>`).join('');
  [turnoPrincipal, filtroTurno, turnoPeriodo].forEach((el) => {
    el.innerHTML = options;
  });
  llenarPeriodosPrincipal();
}

function llenarCategoriasDocente() {
  document.getElementById('categoriasDocente').innerHTML = estado.categorias
    .map((categoria) => `<option value="${categoria}">${categoria}</option>`)
    .join('');
}

function llenarPeriodosPrincipal() {
  const periodos = estado.periodosPorTurno[turnoPrincipal.value] || [];
  periodoPrincipal.innerHTML =
    '<option value="">Selecciona un periodo</option>' +
    periodos.map((periodo) => `<option value="${periodo}">${periodo}</option>`).join('');
}

function calcularHorarioPorAnio(clases, turno) {
  const prioridades = new Map(turno.prioridades.map((item) => [item.dia, item.prioridad]));
  const diasOrdenados = [...turno.dias].sort((a, b) => (prioridades.get(a) || 999) - (prioridades.get(b) || 999));
  const recesoInicio = minutosDesdeHora(turno.horaReceso);
  const recesoFin = recesoInicio + turno.duracionReceso;
  const almuerzoInicio = minutosDesdeHora(turno.horaAlmuerzo);
  const almuerzoFin = almuerzoInicio + turno.duracionAlmuerzo;

  const clasesPorAnio = ANIOS_BASE.reduce((acc, anio) => ({ ...acc, [anio]: [] }), {});
  clases.forEach((clase) => {
    if (!clasesPorAnio[clase.anio]) clasesPorAnio[clase.anio] = [];
    clasesPorAnio[clase.anio].push(clase);
  });

  return Object.entries(clasesPorAnio).map(([anio, clasesAnio]) => {
    const cursoresPorDia = Object.fromEntries(diasOrdenados.map((dia) => [dia, minutosDesdeHora(turno.horaInicio)]));
    const cargaPorDia = Object.fromEntries(diasOrdenados.map((dia) => [dia, 0]));
    const bloques = [];

    clasesAnio.forEach((clase) => {
      const bloquesNecesarios = Math.max(1, Math.ceil(clase.creditos / turno.creditosBloque));

      for (let i = 0; i < bloquesNecesarios; i += 1) {
        const dia = [...diasOrdenados].sort((a, b) => {
          if (cargaPorDia[a] === cargaPorDia[b]) return (prioridades.get(a) || 999) - (prioridades.get(b) || 999);
          return cargaPorDia[a] - cargaPorDia[b];
        })[0];

        let cursor = cursoresPorDia[dia];
        const finTentativo = cursor + turno.minutosBloque;
        if (cursor < recesoFin && finTentativo > recesoInicio) cursor = recesoFin;
        if (cursor < almuerzoFin && finTentativo > almuerzoInicio) cursor = almuerzoFin;

        const inicio = cursor;
        const fin = cursor + turno.minutosBloque;

        bloques.push({
          dia,
          inicio: horaDesdeMinutos(inicio),
          fin: horaDesdeMinutos(fin),
          clase: clase.clase,
          creditos: clase.creditos,
          categorias: clase.categorias,
          tipo: clase.tipo || 'Aula',
        });

        cursoresPorDia[dia] = fin;
        cargaPorDia[dia] += turno.minutosBloque;
      }
    });

    return { anio, bloques };
  });
}

function renderHorarios(generacion) {
  if (!generacion?.horarioPorAnio?.length) {
    mostrarError('No hay horario para mostrar.');
    exportarHorarioCsv.disabled = true;
    return;
  }

  listaHorarios.innerHTML = generacion.horarioPorAnio
    .map(({ anio, bloques }) => {
      if (!bloques.length) return `<li><strong>Año ${anio}</strong><span>Sin clases asignadas.</span></li>`;
      const detalle = bloques
        .map((bloque) => `${bloque.dia} ${bloque.inicio}-${bloque.fin}: ${bloque.clase} (${bloque.creditos} cr, ${bloque.tipo})`)
        .join(' · ');
      return `<li><strong>Año ${anio}</strong><span>${detalle}</span></li>`;
    })
    .join('');
  exportarHorarioCsv.disabled = false;
}

function generarHorarioSeleccionActual() {
  const coordinacion = coordinacionPrincipal.value;
  const carrera = carreraPrincipal.value;
  const turnoNombre = turnoPrincipal.value;
  const periodo = periodoPrincipal.value;
  const turno = estado.turnos.find((item) => item.nombre === turnoNombre);

  if (!coordinacion || !carrera || !turnoNombre || !periodo || !turno) {
    mostrarError('Selecciona coordinación, carrera, turno y periodo.');
    return;
  }

  const clases = estado.clasesPorCarrera[claveCarrera(coordinacion, carrera)] || [];
  if (!clases.length) {
    mostrarError('Esta carrera no tiene clases cargadas (CSV o manuales).');
    return;
  }

  const horarioPorAnio = calcularHorarioPorAnio(clases, turno);
  const horario = { coordinacion, carrera, turno: turnoNombre, periodo, horarioPorAnio };
  estado.horariosGenerados[claveHorario(coordinacion, carrera, turnoNombre, periodo)] = horario;
  estado.vistaActual = horario;
  renderHorarios(horario);
  renderResumen();
}

function agregarClaseManual() {
  const coordinacion = coordinacionPrincipal.value;
  const carrera = carreraPrincipal.value;

  if (!coordinacion || !carrera) {
    estadoClaseManual.textContent = 'Debes seleccionar coordinación y carrera antes de agregar una clase manual.';
    estadoClaseManual.classList.add('error-msg');
    return;
  }

  const nuevaClase = {
    anio: document.getElementById('anioManual').value,
    clase: document.getElementById('claseManual').value.trim(),
    creditos: Number(document.getElementById('creditosManual').value),
    categorias: document.getElementById('categoriasManual').value.trim() || 'General',
    compartida: 'No',
    tipo: document.getElementById('tipoManual').value.trim() || 'Aula',
    origen: 'manual',
  };

  if (!nuevaClase.clase || nuevaClase.creditos <= 0) return;

  const clave = claveCarrera(coordinacion, carrera);
  if (!estado.clasesPorCarrera[clave]) estado.clasesPorCarrera[clave] = [];

  const turno = estado.turnos.find((item) => item.nombre === turnoPrincipal.value);
  const periodo = periodoPrincipal.value;
  const horarioExistente = turno && periodo ? estado.horariosGenerados[claveHorario(coordinacion, carrera, turno.nombre, periodo)] : null;

  if (horarioExistente) {
    const bloquesAnio = horarioExistente.horarioPorAnio.find((h) => h.anio === nuevaClase.anio)?.bloques || [];
    if (bloquesAnio.length) {
      const confirmar = window.confirm(
        `Ya existe horario en el año ${nuevaClase.anio} para ${carrera} (${coordinacion}). Al regenerar se reemplazará lo actual en los bloques correspondientes. ¿Continuar?`
      );
      if (!confirmar) return;
    }
  }

  estado.clasesPorCarrera[clave].push(nuevaClase);
  estadoClaseManual.textContent = `Clase manual agregada al año ${nuevaClase.anio} de ${carrera} (${coordinacion}).`;
  estadoClaseManual.classList.remove('error-msg');

  if (turno && periodo) {
    generarHorarioSeleccionActual();
  }

  renderClasesAdjuntas();
  renderResumen();
  claseManualForm.reset();
  document.getElementById('anioManual').value = '1';
}

function verHorarioConFiltros() {
  const clave = claveHorario(filtroCoordinacion.value, filtroCarrera.value, filtroTurno.value, periodoPrincipal.value);
  const horario = estado.horariosGenerados[clave];
  if (!horario) {
    mostrarError('No existe un horario generado para esos filtros (y periodo activo).');
    return;
  }
  estado.vistaActual = horario;
  renderHorarios(horario);
}

function init() {
  llenarCoordinaciones();
  llenarTurnos();
  renderClasesAdjuntas();
  renderPeriodos();
  renderResumen();
  estadoCsvUpload.textContent = 'Aún no seleccionas un archivo CSV.';
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

coordinacionPrincipal.addEventListener('change', () => llenarCarreras(coordinacionPrincipal, carreraPrincipal));
coordinacionAdjunta.addEventListener('change', () => llenarCarreras(coordinacionAdjunta, carreraAdjunta));
filtroCoordinacion.addEventListener('change', () => llenarCarreras(filtroCoordinacion, filtroCarrera));
turnoPrincipal.addEventListener('change', llenarPeriodosPrincipal);

csvClases.addEventListener('change', () => {
  const archivo = csvClases.files[0];
  estadoCsvUpload.textContent = archivo ? `Archivo seleccionado: ${archivo.name}` : 'Aún no seleccionas un archivo CSV.';
});

generalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const coordinacion = document.getElementById('nombreCoordinacion').value.trim();
  const carreras = document
    .getElementById('carrerasCoordinacion')
    .value.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!coordinacion || !carreras.length) return;
  estado.coordinaciones[coordinacion] = carreras;
  generalForm.reset();
  renderCoordinaciones();
  llenarCoordinaciones();
  renderResumen();
});

categoriaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const categoria = document.getElementById('nombreCategoria').value.trim();
  if (categoria && !estado.categorias.includes(categoria)) estado.categorias.push(categoria);
  categoriaForm.reset();
  renderCategorias();
  llenarCategoriasDocente();
});

docenteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nombre = document.getElementById('nombreDocente').value.trim();
  const categorias = Array.from(document.getElementById('categoriasDocente').selectedOptions).map((o) => o.value);
  if (!nombre || !categorias.length) return;
  estado.docentes.push({ nombre, categorias });
  docenteForm.reset();
  renderDocentes();
});

turnoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nombre = document.getElementById('nombreTurno').value.trim();
  const dias = document
    .getElementById('diasTurno')
    .value.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!nombre || !dias.length) return;

  const prioridadTexto = document.getElementById('prioridadDias').value.trim() || PRIORIDAD_DEFAULT;
  const turno = {
    nombre,
    dias,
    prioridadTexto,
    prioridades: parsePrioridades(prioridadTexto, dias),
    horaInicio: document.getElementById('horaInicio').value || '08:00',
    minutosBloque: Number(document.getElementById('minutosBloque').value),
    creditosBloque: Number(document.getElementById('creditosBloque').value),
    horaReceso: document.getElementById('horaReceso').value,
    duracionReceso: Number(document.getElementById('duracionReceso').value),
    horaAlmuerzo: document.getElementById('horaAlmuerzo').value,
    duracionAlmuerzo: Number(document.getElementById('duracionAlmuerzo').value),
  };

  const idx = estado.turnos.findIndex((item) => item.nombre === nombre);
  if (idx >= 0) estado.turnos[idx] = turno;
  else estado.turnos.push(turno);

  if (!estado.periodosPorTurno[nombre]) estado.periodosPorTurno[nombre] = [];

  turnoForm.reset();
  document.getElementById('horaInicio').value = '08:00';
  document.getElementById('minutosBloque').value = '45';
  renderTurnos();
  llenarTurnos();
  renderPeriodos();
  renderResumen();
});

periodoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const turno = turnoPeriodo.value;
  const periodo = document.getElementById('nombrePeriodo').value;
  if (!turno || !periodo) return;

  if (!estado.periodosPorTurno[turno]) estado.periodosPorTurno[turno] = [];
  if (!estado.periodosPorTurno[turno].includes(periodo)) estado.periodosPorTurno[turno].push(periodo);

  periodoForm.reset();
  renderPeriodos();
  llenarPeriodosPrincipal();
  renderResumen();
});

listaPeriodos.addEventListener('click', (event) => {
  const btn = event.target.closest('.btn-eliminar-periodo');
  if (!btn) return;
  const turno = btn.dataset.turno;
  const periodo = btn.dataset.periodo;
  estado.periodosPorTurno[turno] = (estado.periodosPorTurno[turno] || []).filter((item) => item !== periodo);

  Object.keys(estado.horariosGenerados).forEach((key) => {
    if (key.endsWith(`::${periodo}`) && key.includes(`::${turno}::`)) delete estado.horariosGenerados[key];
  });

  renderPeriodos();
  llenarPeriodosPrincipal();
  renderResumen();
});

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

  const clave = claveCarrera(coordinacion, carrera);
  const manuales = (estado.clasesPorCarrera[clave] || []).filter((c) => c.origen === 'manual');
  estado.clasesPorCarrera[clave] = [...clases, ...manuales];

  coordinacionPrincipal.value = coordinacion;
  llenarCarreras(coordinacionPrincipal, carreraPrincipal);
  carreraPrincipal.value = carrera;

  estadoCsvUpload.textContent = `CSV cargado correctamente: ${archivo.name}`;
  renderClasesAdjuntas();
  renderResumen();
  adjuntarClasesForm.reset();
});

generarHorarioForm.addEventListener('submit', (event) => {
  event.preventDefault();
  generarHorarioSeleccionActual();
});

claseManualForm.addEventListener('submit', (event) => {
  event.preventDefault();
  agregarClaseManual();
});

verHorarioFiltrado.addEventListener('click', verHorarioConFiltros);

reiniciarHorarios.addEventListener('click', () => {
  estado.horariosGenerados = {};
  estado.clasesPorCarrera = {};
  estado.vistaActual = null;
  listaHorarios.innerHTML = '<li><span>Horarios reiniciados. La configuración se mantiene.</span></li>';
  exportarHorarioCsv.disabled = true;
  renderClasesAdjuntas();
  renderResumen();
});

descargarPlantillaCsv.addEventListener('click', () => {
  const plantilla =
    'clase,año,credito,categoria,compartida,tipo\n' +
    'Cálculo I,1,4,Matemática,No,Aula\n' +
    'Programación I,1,5,Programación,No,Laboratorio\n' +
    'Física General,2,4,Ciencias,Sí,Taller';
  descargarCSV('plantilla_clases.csv', plantilla);
});

exportarHorarioCsv.addEventListener('click', () => {
  if (!estado.vistaActual?.horarioPorAnio?.length) return;
  const filas = ['clase,año,credito,categoria,compartida,tipo,día,inicio,fin'];
  estado.vistaActual.horarioPorAnio.forEach(({ anio, bloques }) => {
    bloques.forEach((bloque) => {
      const claseOriginal = (estado.clasesPorCarrera[claveCarrera(estado.vistaActual.coordinacion, estado.vistaActual.carrera)] || []).find(
        (item) => item.clase === bloque.clase && item.anio === anio
      );
      filas.push(
        [
          bloque.clase,
          anio,
          bloque.creditos,
          bloque.categorias,
          claseOriginal?.compartida || 'No',
          bloque.tipo || claseOriginal?.tipo || 'Aula',
          bloque.dia,
          bloque.inicio,
          bloque.fin,
        ].join(',')
      );
    });
  });
  descargarCSV(`horario_${estado.vistaActual.carrera}_${estado.vistaActual.turno}_${estado.vistaActual.periodo}.csv`, filas.join('\n'));
});

init();
