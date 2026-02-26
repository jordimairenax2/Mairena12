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
const DIAS_TABLA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DURACION_CLASE_MINUTOS = 45;
const HORA_INICIO_JORNADA = '08:00';
const HORA_FIN_JORNADA = '14:00';
const CLASES_POR_DIA = 4;

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
const cambiarClaseForm = document.getElementById('cambiarClaseForm');

const coordinacionPrincipal = document.getElementById('coordinacionPrincipal');
const carreraPrincipal = document.getElementById('carreraPrincipal');
const turnoPrincipal = document.getElementById('turnoPrincipal');
const periodoPrincipal = document.getElementById('periodoPrincipal');
const coordinacionGeneracion = document.getElementById('coordinacionGeneracion');
const carreraGeneracion = document.getElementById('carreraGeneracion');
const turnoGeneracion = document.getElementById('turnoGeneracion');

const coordinacionAdjunta = document.getElementById('coordinacionAdjunta');
const carreraAdjunta = document.getElementById('carreraAdjunta');
const turnoAdjunta = document.getElementById('turnoAdjunta');
const csvClases = document.getElementById('csvClases');
const estadoCsvUpload = document.getElementById('estadoCsvUpload');
const estadoImportacion = document.getElementById('estadoImportacion');
const estadoGeneracion = document.getElementById('estadoGeneracion');

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
const tablaClasesBody = document.getElementById('tablaClasesBody');
const tablaHorarioBody = document.getElementById('tablaHorarioBody');

const descargarPlantillaCsv = document.getElementById('descargarPlantillaCsv');
const exportarHorarioCsv = document.getElementById('exportarHorarioCsv');
const verHorarioFiltrado = document.getElementById('verHorarioFiltrado');
const reiniciarHorarios = document.getElementById('reiniciarHorarios');
const estadoClaseManual = document.getElementById('estadoClaseManual');
const turnoPeriodo = document.getElementById('turnoPeriodo');
const claseExistenteSelect = document.getElementById('claseExistenteSelect');

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
  const horas = Math.floor(totalMinutos / 60).toString().padStart(2, '0');
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
  const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean);
  if (!lineas.length) return { clases: [], error: 'El CSV está vacío.' };

  const normalizar = (valor) => valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

  const faltantes = Object.entries(indices).filter(([campo, idx]) => campo !== 'compartida' && idx < 0).map(([campo]) => campo);
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
  const clasesUnicas = Array.from(
    new Map(
      clasesValidas.map((clase) => {
        const key = `${clase.anio}::${clase.clase.toLowerCase().trim()}`;
        return [key, clase];
      })
    ).values()
  );
  if (!clasesUnicas.length) return { clases: [], error: 'No hay filas válidas.' };
  return { clases: clasesUnicas, error: '' };
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
      (turno) =>
        `<li><strong>${turno.nombre}</strong><span>Días: ${turno.dias.join(', ')}</span><span>Máx semana: ${turno.maxRepeticionesSemana} · Máx día: ${turno.maxRepeticionesDia}</span></li>`
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

function docentePreferido(categoria) {
  const c = categoria?.toLowerCase().trim();
  const docente = estado.docentes.find((d) => d.categorias.some((dc) => dc.toLowerCase() === c));
  return docente?.nombre || 'Sin asignar';
}

function renderTablaClases() {
  const filas = Object.entries(estado.clasesPorCarrera).flatMap(([clave, clases]) => {
    const [coordinacion, carrera] = clave.split('::');
    return clases.map((clase) => {
      const caracteristicas = `${(clase.tipo || 'aula').toLowerCase()} · ${clase.compartida || 'No compartida'} · Sesiones:${Math.max(1, clase.creditos)} · Año:${clase.anio}`;
      return `<tr><td>${coordinacion}</td><td>${carrera}</td><td>${clase.clase}</td><td>${caracteristicas}</td><td>${docentePreferido(
        clase.categorias
      )}</td><td>${clase.categorias}</td></tr>`;
    });
  });
  tablaClasesBody.innerHTML = filas.join('') || '<tr><td colspan="6">Sin clases cargadas.</td></tr>';
}

function renderClasesAdjuntas() {
  const entradas = Object.entries(estado.clasesPorCarrera);
  listaClasesAdjuntas.innerHTML =
    entradas
      .map(([clave, clases]) => {
        const [coordinacion, carrera] = clave.split('::');
        return `<li><strong>${coordinacion} / ${carrera}</strong><span>${clases.length} clase(s) cargadas.</span></li>`;
      })
      .join('') || '<li><span>Aún no hay clases adjuntas.</span></li>';
  renderTablaClases();
  actualizarSelectorClasesExistentes();
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
  const options = '<option value="">Selecciona una coordinación</option>' + Object.keys(estado.coordinaciones).map((coord) => `<option value="${coord}">${coord}</option>`).join('');
  [coordinacionPrincipal, coordinacionAdjunta, filtroCoordinacion, coordinacionGeneracion].forEach((el) => {
    el.innerHTML = options;
  });
}

function llenarCarreras(selectCoord, selectCarrera) {
  const carreras = estado.coordinaciones[selectCoord.value] || [];
  selectCarrera.innerHTML = '<option value="">Selecciona una carrera</option>' + carreras.map((carrera) => `<option value="${carrera}">${carrera}</option>`).join('');
}

function llenarTurnos() {
  const options = '<option value="">Selecciona un turno</option>' + estado.turnos.map((turno) => `<option value="${turno.nombre}">${turno.nombre}</option>`).join('');
  [turnoPrincipal, filtroTurno, turnoPeriodo, turnoAdjunta, turnoGeneracion].forEach((el) => {
    el.innerHTML = options;
  });
  llenarPeriodosPrincipal();
}

function llenarCategoriasDocente() {
  document.getElementById('categoriasDocente').innerHTML = estado.categorias.map((categoria) => `<option value="${categoria}">${categoria}</option>`).join('');
}

function llenarPeriodosPrincipal() {
  const periodos = estado.periodosPorTurno[turnoGeneracion.value] || [];
  periodoPrincipal.innerHTML = '<option value="">Selecciona un periodo</option>' + periodos.map((periodo) => `<option value="${periodo}">${periodo}</option>`).join('');
}

function obtenerBloquesDisponibles(turno) {
  if (!turno) return [];
  const bloques = [];
  const duracionBloque = DURACION_CLASE_MINUTOS;
  const inicioJornada = minutosDesdeHora(HORA_INICIO_JORNADA);
  const finJornada = minutosDesdeHora(HORA_FIN_JORNADA);
  const recesoInicio = minutosDesdeHora(turno.horaReceso);
  const recesoFin = recesoInicio + turno.duracionReceso;
  const almuerzoInicio = minutosDesdeHora(turno.horaAlmuerzo);
  const almuerzoFin = almuerzoInicio + turno.duracionAlmuerzo;
  let cursor = inicioJornada;
  let indice = 0;

  while (cursor + duracionBloque <= finJornada) {
    const cruzaReceso = cursor < recesoFin && cursor + duracionBloque > recesoInicio;
    const cruzaAlmuerzo = cursor < almuerzoFin && cursor + duracionBloque > almuerzoInicio;
    if (cruzaReceso) {
      cursor = recesoFin;
      continue;
    }
    if (cruzaAlmuerzo) {
      cursor = almuerzoFin;
      continue;
    }

    const inicio = cursor;
    const fin = cursor + duracionBloque;
    bloques.push({ etiqueta: `${turno.nombre[0] || 'B'}${indice + 1}`, inicio: horaDesdeMinutos(inicio), fin: horaDesdeMinutos(fin) });
    cursor = fin;
    indice += 1;
  }

  return bloques;
}

function construirBloquesTurno(turno) {
  return obtenerBloquesDisponibles(turno);
}

function calcularHorarioPorAnio(clases, turno) {
  const prioridades = new Map(turno.prioridades.map((item) => [item.dia, item.prioridad]));
  const diasOrdenados = [...turno.dias].sort((a, b) => (prioridades.get(a) || 999) - (prioridades.get(b) || 999));
  const bloquesDia = obtenerBloquesDisponibles(turno).slice(0, CLASES_POR_DIA);

  const clasesPorAnio = ANIOS_BASE.reduce((acc, anio) => ({ ...acc, [anio]: [] }), {});
  clases.forEach((clase) => {
    if (!clasesPorAnio[clase.anio]) clasesPorAnio[clase.anio] = [];
    clasesPorAnio[clase.anio].push(clase);
  });

  return Object.entries(clasesPorAnio).map(([anio, clasesAnio]) => {
    if (!clasesAnio.length) return { anio, bloques: [] };

    const bloques = [];
    let indiceRotacion = 0;

    const seleccionarClase = (clasesUsadas) => {
      const total = clasesAnio.length;
      for (let i = 0; i < total; i += 1) {
        const idx = (indiceRotacion + i) % total;
        const candidata = clasesAnio[idx];
        if (!clasesUsadas.has(candidata.clase) || clasesUsadas.size >= total) {
          indiceRotacion = (idx + 1) % total;
          return candidata;
        }
      }
      const fallback = clasesAnio[indiceRotacion++ % total];
      return fallback;
    };

    diasOrdenados.forEach((dia) => {
      const clasesUsadas = new Set();
      bloquesDia.forEach((bloqueTurno) => {
        const clase = seleccionarClase(clasesUsadas);
        clasesUsadas.add(clase.clase);

        bloques.push({
          dia,
          inicio: bloqueTurno.inicio,
          fin: bloqueTurno.fin,
          clase: clase.clase,
          creditos: clase.creditos,
          categorias: clase.categorias,
          tipo: clase.tipo || 'Aula',
        });
      });
    });

    return { anio, bloques };
  });
}

function renderTablaHorario(generacion) {
  const turno = estado.turnos.find((t) => t.nombre === (generacion?.turno || filtroTurno.value || turnoGeneracion.value));
  const bloquesBase = construirBloquesTurno(turno).slice(0, CLASES_POR_DIA);
  if (!bloquesBase.length) {
    tablaHorarioBody.innerHTML = '<tr><td colspan="6">Configura un turno para ver la tabla.</td></tr>';
    return;
  }

  const bloquesPrioritarios = generacion?.horarioPorAnio
    ?.slice()
    .sort((a, b) => b.bloques.length - a.bloques.length)?.[0]?.bloques || [];
  const filas = bloquesBase.map((bloque) => {
    const celdasDia = DIAS_TABLA.map((dia) => {
      const clase = bloquesPrioritarios.find((b) => b.dia === dia && b.inicio === bloque.inicio);
      return `<td>${clase ? clase.clase : '-'}</td>`;
    }).join('');
    return `<tr><td>${bloque.etiqueta}<br><small>${bloque.inicio}-${bloque.fin}</small></td>${celdasDia}</tr>`;
  });
  tablaHorarioBody.innerHTML = filas.join('');
}

function renderHorarios(generacion) {
  if (!generacion?.horarioPorAnio?.length) {
    mostrarError('No hay horario para mostrar.');
    exportarHorarioCsv.disabled = true;
    renderTablaHorario(null);
    return;
  }

  listaHorarios.innerHTML = generacion.horarioPorAnio
    .map(({ anio, bloques }) => {
      if (!bloques.length) return `<li><strong>Año ${anio}</strong><span>Sin clases asignadas.</span></li>`;
      const detalle = bloques.map((bloque) => `${bloque.dia} ${bloque.inicio}-${bloque.fin}: ${bloque.clase}`).join(' · ');
      return `<li><strong>Año ${anio}</strong><span>${detalle}</span></li>`;
    })
    .join('');
  exportarHorarioCsv.disabled = false;
  renderTablaHorario(generacion);
}

function generarHorarioSeleccionActual() {
  const coordinacion = coordinacionGeneracion.value;
  const carrera = carreraGeneracion.value;
  const turnoNombre = turnoGeneracion.value;
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
  const horario = { coordinacion, carrera, turno: turnoNombre, periodo, anioTrazabilidad: document.getElementById('anioTrazabilidad').value, horarioPorAnio };
  estado.horariosGenerados[claveHorario(coordinacion, carrera, turnoNombre, periodo)] = horario;
  estado.vistaActual = horario;
  renderHorarios(horario);
  estadoGeneracion.textContent = 'Horario generado automáticamente.';
  renderResumen();
}

function actualizarSelectorClasesExistentes() {
  const coordinacion = coordinacionPrincipal.value;
  const carrera = carreraPrincipal.value;
  const clases = estado.clasesPorCarrera[claveCarrera(coordinacion, carrera)] || [];
  claseExistenteSelect.innerHTML = '<option value="">Selecciona una clase</option>' + clases.map((clase, idx) => `<option value="${idx}">${clase.clase} (Año ${clase.anio})</option>`).join('');
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
    compartida: 'No compartida',
    tipo: document.getElementById('tipoManual').value.trim() || 'Aula',
    origen: 'manual',
  };

  if (!nuevaClase.clase || nuevaClase.creditos <= 0) return;

  const clave = claveCarrera(coordinacion, carrera);
  if (!estado.clasesPorCarrera[clave]) estado.clasesPorCarrera[clave] = [];
  estado.clasesPorCarrera[clave].push(nuevaClase);
  estadoClaseManual.textContent = `Clase manual agregada al año ${nuevaClase.anio} de ${carrera} (${coordinacion}).`;
  estadoClaseManual.classList.remove('error-msg');

  renderClasesAdjuntas();
  renderResumen();
  claseManualForm.reset();
  document.getElementById('anioManual').value = '1';
}

function cambiarClaseExistente() {
  const coordinacion = coordinacionPrincipal.value;
  const carrera = carreraPrincipal.value;
  const idx = Number(claseExistenteSelect.value);
  const clave = claveCarrera(coordinacion, carrera);
  const clases = estado.clasesPorCarrera[clave] || [];
  if (Number.isNaN(idx) || idx < 0 || !clases[idx]) return;

  const nuevoNombre = document.getElementById('nuevoNombreClase').value.trim();
  const nuevosCreditos = Number(document.getElementById('nuevosCreditosClase').value);
  if (nuevoNombre) clases[idx].clase = nuevoNombre;
  if (nuevosCreditos > 0) clases[idx].creditos = nuevosCreditos;

  estadoClaseManual.textContent = 'Clase actualizada correctamente.';
  estadoClaseManual.classList.remove('error-msg');
  cambiarClaseForm.reset();
  renderClasesAdjuntas();
}

function verHorarioConFiltros() {
  const clave = claveHorario(filtroCoordinacion.value, filtroCarrera.value, filtroTurno.value, periodoPrincipal.value);
  const horario = estado.horariosGenerados[clave];
  if (!horario) {
    mostrarError('No existe un horario generado para esos filtros (y periodo activo).');
    renderTablaHorario(null);
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
  estadoCsvUpload.textContent = 'Ningún archivo seleccionado';
  renderTablaHorario(null);
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

coordinacionPrincipal.addEventListener('change', () => {
  llenarCarreras(coordinacionPrincipal, carreraPrincipal);
  actualizarSelectorClasesExistentes();
});
coordinacionAdjunta.addEventListener('change', () => llenarCarreras(coordinacionAdjunta, carreraAdjunta));
filtroCoordinacion.addEventListener('change', () => llenarCarreras(filtroCoordinacion, filtroCarrera));
coordinacionGeneracion.addEventListener('change', () => llenarCarreras(coordinacionGeneracion, carreraGeneracion));
turnoGeneracion.addEventListener('change', llenarPeriodosPrincipal);
carreraPrincipal.addEventListener('change', actualizarSelectorClasesExistentes);

csvClases.addEventListener('change', () => {
  const archivo = csvClases.files[0];
  estadoCsvUpload.textContent = archivo ? archivo.name : 'Ningún archivo seleccionado';
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
  renderTablaClases();
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
    horaInicio: HORA_INICIO_JORNADA,
    minutosBloque: DURACION_CLASE_MINUTOS,
    creditosBloque: Number(document.getElementById('creditosBloque').value),
    maxRepeticionesSemana: Number(document.getElementById('maxRepeticionesSemana').value) || 3,
    maxRepeticionesDia: Number(document.getElementById('maxRepeticionesDia').value) || 1,
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
  document.getElementById('maxRepeticionesSemana').value = '3';
  document.getElementById('maxRepeticionesDia').value = '1';
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
  if (!archivo || !coordinacion || !carrera || !turnoAdjunta.value) return;

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
  coordinacionGeneracion.value = coordinacion;
  filtroCoordinacion.value = coordinacion;
  llenarCarreras(coordinacionPrincipal, carreraPrincipal);
  llenarCarreras(coordinacionGeneracion, carreraGeneracion);
  llenarCarreras(filtroCoordinacion, filtroCarrera);
  carreraPrincipal.value = carrera;
  carreraGeneracion.value = carrera;
  filtroCarrera.value = carrera;
  turnoGeneracion.value = turnoAdjunta.value;
  turnoPrincipal.value = turnoAdjunta.value;
  filtroTurno.value = turnoAdjunta.value;
  llenarPeriodosPrincipal();

  estadoCsvUpload.textContent = archivo.name;
  estadoImportacion.textContent = 'Importación completada correctamente.';
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

cambiarClaseForm.addEventListener('submit', (event) => {
  event.preventDefault();
  cambiarClaseExistente();
});

verHorarioFiltrado.addEventListener('click', verHorarioConFiltros);

reiniciarHorarios.addEventListener('click', () => {
  estado.horariosGenerados = {};
  estado.vistaActual = null;
  listaHorarios.innerHTML = '<li><span>Horario reiniciado sin borrar la configuración.</span></li>';
  exportarHorarioCsv.disabled = true;
  estadoGeneracion.textContent = 'Horario reiniciado sin borrar la configuración.';
  renderTablaHorario(null);
  renderResumen();
});

descargarPlantillaCsv.addEventListener('click', () => {
  const plantilla =
    'clase,creditos,compartida,anio,categoria,tipo\n' +
    'Taller de Diseño,2,No compartida,1,Tecnología,Taller\n' +
    'Identidad Nacional,1,Compartida,1,Ciencias Básicas,Aula';
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
      filas.push([
        bloque.clase,
        anio,
        bloque.creditos,
        bloque.categorias,
        claseOriginal?.compartida || 'No',
        bloque.tipo || claseOriginal?.tipo || 'Aula',
        bloque.dia,
        bloque.inicio,
        bloque.fin,
      ].join(','));
    });
  });
  descargarCSV(`horario_${estado.vistaActual.carrera}_${estado.vistaActual.turno}_${estado.vistaActual.periodo}.csv`, filas.join('\n'));
});

init();
