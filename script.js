const estado = {
  coordinacion: null,
  carrera: null,
  materias: [],
  docentes: [],
  categorias: [],
  turnos: [],
  bloques: null,
  recesos: null,
  areasAplicadas: {
    general: false,
    materias: false,
    docentes: false,
    horario: false,
  },
};

const generalForm = document.getElementById("generalForm");
const csvInput = document.getElementById("csvInput");
const materiasPreview = document.getElementById("materiasPreview");
const btnProcesarCsv = document.getElementById("btnProcesarCsv");
const docenteForm = document.getElementById("docenteForm");
const categoriaForm = document.getElementById("categoriaForm");
const listaDocentes = document.getElementById("listaDocentes");
const listaCategorias = document.getElementById("listaCategorias");
const docenteCategoria = document.getElementById("docenteCategoria");
const turnoForm = document.getElementById("turnoForm");
const bloqueForm = document.getElementById("bloqueForm");
const recesoForm = document.getElementById("recesoForm");
const btnAplicarGeneral = document.getElementById("btnAplicarGeneral");
const btnAplicarMaterias = document.getElementById("btnAplicarMaterias");
const btnAplicarDocentes = document.getElementById("btnAplicarDocentes");
const btnAplicarHorario = document.getElementById("btnAplicarHorario");
const resumen = document.getElementById("resumen");

function limpiarTexto(valor) {
  return valor.trim();
}

function convertirPrioridades(texto) {
  return texto
    .split(",")
    .map((par) => par.trim())
    .filter(Boolean)
    .map((par) => {
      const [dia, prioridad] = par.split(":").map(limpiarTexto);
      return { dia, prioridad: Number(prioridad) };
    })
    .filter((item) => item.dia && Number.isFinite(item.prioridad));
}

function renderMaterias() {
  if (!estado.materias.length) {
    materiasPreview.innerHTML = "";
    return;
  }

  const rows = estado.materias
    .map(
      (materia) => `
      <tr>
        <td>${materia.clase}</td>
        <td>${materia.anio}</td>
        <td>${materia.credito}</td>
        <td>${materia.categoria}</td>
      </tr>
    `
    )
    .join("");

  materiasPreview.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Clase</th>
          <th>Año</th>
          <th>Crédito</th>
          <th>Categoría</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderDocentes() {
  listaDocentes.innerHTML = estado.docentes
    .map(
      (docente) =>
        `<li><strong>${docente.nombre}</strong><span>${docente.especialidades.join(", ")}</span></li>`
    )
    .join("");

  docenteCategoria.innerHTML = `
    <option value="">Selecciona un maestro</option>
    ${estado.docentes.map((d) => `<option>${d.nombre}</option>`).join("")}
  `;
}

function renderCategorias() {
  listaCategorias.innerHTML = estado.categorias
    .map((item) => `<li><strong>${item.categoria}</strong><span>${item.docente}</span></li>`)
    .join("");
}

function marcarAreaAplicada(area) {
  estado.areasAplicadas[area] = true;
  renderResumen();
}

function renderResumen() {
  resumen.classList.remove("vacío");
  const ultimoTurno = estado.turnos.at(-1);

  resumen.innerHTML = `
    <strong>Coordinación:</strong> ${estado.coordinacion || "Pendiente"}<br>
    <strong>Carrera:</strong> ${estado.carrera || "Pendiente"}<br>
    <strong>Materias cargadas por CSV:</strong> ${estado.materias.length}<br>
    <strong>Maestros registrados:</strong> ${estado.docentes.length}<br>
    <strong>Categorías asignadas:</strong> ${estado.categorias.length}<br>
    <strong>Turnos configurados:</strong> ${estado.turnos.length}<br>
    <strong>Último turno:</strong> ${
      ultimoTurno
        ? `${ultimoTurno.nombre} (${ultimoTurno.dias.join(", ")})`
        : "Sin turno registrado"
    }<br>
    <strong>Bloques:</strong> ${
      estado.bloques
        ? `${estado.bloques.creditoPorBloque} crédito(s) / ${estado.bloques.minutosPorBloque} min`
        : "Pendiente"
    }<br>
    <strong>Receso:</strong> ${
      estado.recesos ? `${estado.recesos.recesoInicio} - ${estado.recesos.recesoFin}` : "Pendiente"
    }<br>
    <strong>Almuerzo:</strong> ${
      estado.recesos
        ? `${estado.recesos.almuerzoInicio} - ${estado.recesos.almuerzoFin}`
        : "Pendiente"
    }<br>
    <strong>Aplicación por áreas:</strong><br>
    - General: ${estado.areasAplicadas.general ? "Aplicada" : "Pendiente"}<br>
    - Materias: ${estado.areasAplicadas.materias ? "Aplicada" : "Pendiente"}<br>
    - Docentes y categorías: ${estado.areasAplicadas.docentes ? "Aplicada" : "Pendiente"}<br>
    - Horario: ${estado.areasAplicadas.horario ? "Aplicada" : "Pendiente"}
  `;
}

generalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  estado.coordinacion = document.getElementById("nombreCoordinacion").value.trim();
  estado.carrera = document.getElementById("nombreCarrera").value.trim();
  generalForm.reset();
  renderResumen();
});

btnProcesarCsv.addEventListener("click", () => {
  const filas = csvInput.value
    .split("\n")
    .map((fila) => fila.trim())
    .filter(Boolean);

  const materias = filas
    .map((fila) => {
      const [clase, anio, credito, categoria] = fila.split(",").map(limpiarTexto);
      return { clase, anio, credito, categoria };
    })
    .filter((m) => m.clase && m.anio && m.credito && m.categoria);

  estado.materias = materias;
  renderMaterias();
  renderResumen();
});

docenteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nombre = document.getElementById("nombreDocente").value.trim();
  const especialidades = document
    .getElementById("especialidades")
    .value.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  estado.docentes.push({ nombre, especialidades });
  docenteForm.reset();
  renderDocentes();
  renderResumen();
});

categoriaForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const categoria = document.getElementById("categoriaNombre").value.trim();
  const docente = docenteCategoria.value;

  estado.categorias.push({ categoria, docente });
  categoriaForm.reset();
  renderCategorias();
  renderResumen();
});

turnoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nombre = document.getElementById("nombreTurno").value.trim();
  const dias = document
    .getElementById("diasTurno")
    .value.split(",")
    .map((dia) => dia.trim())
    .filter(Boolean);
  const prioridades = convertirPrioridades(document.getElementById("prioridadDia").value);

  estado.turnos.push({ nombre, dias, prioridades });
  turnoForm.reset();
  renderResumen();
});

bloqueForm.addEventListener("submit", (event) => {
  event.preventDefault();
  estado.bloques = {
    creditoPorBloque: document.getElementById("creditoBloque").value,
    minutosPorBloque: document.getElementById("minutosBloque").value,
  };
  bloqueForm.reset();
  renderResumen();
});

recesoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  estado.recesos = {
    recesoInicio: document.getElementById("recesoInicio").value,
    recesoFin: document.getElementById("recesoFin").value,
    almuerzoInicio: document.getElementById("almuerzoInicio").value,
    almuerzoFin: document.getElementById("almuerzoFin").value,
  };
  renderResumen();
});

btnAplicarGeneral.addEventListener("click", () => marcarAreaAplicada("general"));
btnAplicarMaterias.addEventListener("click", () => marcarAreaAplicada("materias"));
btnAplicarDocentes.addEventListener("click", () => marcarAreaAplicada("docentes"));
btnAplicarHorario.addEventListener("click", () => marcarAreaAplicada("horario"));
