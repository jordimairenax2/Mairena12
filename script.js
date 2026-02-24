const carrerasPorCoordinacion = {
  AQT: ["Diseño Gráfico", "Arquitectura", "Sistemas"],
};

const estado = {
  seleccionPrincipal: null,
  turnos: [],
  areas: [],
  docentes: [],
  matricula: [],
};

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const coordinacionPrincipal = document.getElementById("coordinacionPrincipal");
const carreraPrincipal = document.getElementById("carreraPrincipal");
const carreraMatricula = document.getElementById("carreraMatricula");
const seleccionForm = document.getElementById("seleccionForm");
const matriculaForm = document.getElementById("matriculaForm");
const listaMatricula = document.getElementById("listaMatricula");
const turnoForm = document.getElementById("turnoForm");
const listaTurnos = document.getElementById("listaTurnos");
const areaForm = document.getElementById("areaForm");
const listaAreas = document.getElementById("listaAreas");
const docenteForm = document.getElementById("docenteForm");
const listaDocentes = document.getElementById("listaDocentes");
const resumen = document.getElementById("resumen");

function llenarCarreras(select, coordinacion) {
  const carreras = carrerasPorCoordinacion[coordinacion] || [];
  select.innerHTML = `
    <option value="">Selecciona una carrera</option>
    ${carreras.map((carrera) => `<option value="${carrera}">${carrera}</option>`).join("")}
  `;
}

function renderTurnos() {
  listaTurnos.innerHTML = estado.turnos
    .map(
      (turno) =>
        `<li><strong>${turno.nombre}</strong><span>Días: ${turno.dias.join(", ")} | ${turno.duracion} min | ${turno.credito} crédito(s) | Máx. ${turno.maxBloques} bloques/día</span></li>`
    )
    .join("");
}

function renderAreas() {
  listaAreas.innerHTML = estado.areas
    .map((area) => `<li><strong>${area}</strong></li>`)
    .join("");
}

function renderDocentes() {
  listaDocentes.innerHTML = estado.docentes
    .map(
      (docente) => `<li><strong>${docente.nombre}</strong><span>Áreas: ${docente.areas.join(", ")}</span></li>`
    )
    .join("");
}

function renderMatricula() {
  listaMatricula.innerHTML = estado.matricula
    .map(
      (item) => `<li><strong>${item.carrera}</strong><span>${item.cantidad} estudiante(s)</span></li>`
    )
    .join("");
}

function renderResumen() {
  resumen.classList.remove("vacío");
  const seleccion = estado.seleccionPrincipal
    ? `${estado.seleccionPrincipal.coordinacion} / ${estado.seleccionPrincipal.carrera}`
    : "Pendiente";

  resumen.innerHTML = `
    <strong>Selección principal:</strong> ${seleccion}<br>
    <strong>Turnos configurados:</strong> ${estado.turnos.length}<br>
    <strong>Áreas registradas:</strong> ${estado.areas.length}<br>
    <strong>Docentes registrados:</strong> ${estado.docentes.length}<br>
    <strong>Carreras con matrícula cargada:</strong> ${estado.matricula.length}
  `;
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabId = button.dataset.tab;
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(`tab-${tabId}`).classList.add("active");
  });
});

coordinacionPrincipal.addEventListener("change", () => {
  const coordinacion = coordinacionPrincipal.value;
  llenarCarreras(carreraPrincipal, coordinacion);
  llenarCarreras(carreraMatricula, coordinacion);
});

seleccionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  estado.seleccionPrincipal = {
    coordinacion: coordinacionPrincipal.value,
    carrera: carreraPrincipal.value,
  };

  renderResumen();
});

matriculaForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const carrera = carreraMatricula.value;
  const cantidad = Number(document.getElementById("cantidadEstudiantes").value);

  const existente = estado.matricula.find((item) => item.carrera === carrera);
  if (existente) {
    existente.cantidad = cantidad;
  } else {
    estado.matricula.push({ carrera, cantidad });
  }

  matriculaForm.reset();
  llenarCarreras(carreraMatricula, coordinacionPrincipal.value);
  renderMatricula();
  renderResumen();
});

turnoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = document.getElementById("nombreTurno").value;
  const dias = document
    .getElementById("diasTurno")
    .value.split(",")
    .map((dia) => dia.trim())
    .filter(Boolean);

  estado.turnos.push({
    nombre,
    dias,
    duracion: Number(document.getElementById("duracionBloque").value),
    credito: Number(document.getElementById("creditoBloque").value),
    maxBloques: Number(document.getElementById("maxBloquesDia").value),
  });

  turnoForm.reset();
  renderTurnos();
  renderResumen();
});

areaForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nombreArea = document.getElementById("nombreArea").value.trim();

  if (!estado.areas.includes(nombreArea)) {
    estado.areas.push(nombreArea);
  }

  areaForm.reset();
  renderAreas();
  renderResumen();
});

docenteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = document.getElementById("nombreDocente").value.trim();
  const areas = document
    .getElementById("areasDocente")
    .value.split(",")
    .map((area) => area.trim())
    .filter(Boolean);

  estado.docentes.push({ nombre, areas });

  docenteForm.reset();
  renderDocentes();
  renderResumen();
});

renderResumen();
