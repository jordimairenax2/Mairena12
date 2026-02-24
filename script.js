const ofertaAcademica = [
  {
    codigo: "INF-101",
    nombre: "Programación I",
    docente: "Ing. Laura Mejía",
    aula: "B-203",
    dia: "Lunes",
    inicio: "08:00",
    fin: "09:40",
  },
  {
    codigo: "INF-120",
    nombre: "Base de Datos",
    docente: "MSc. Ricardo Núñez",
    aula: "LAB-05",
    dia: "Martes",
    inicio: "10:00",
    fin: "11:40",
  },
  {
    codigo: "MAT-110",
    nombre: "Cálculo I",
    docente: "Lic. Elena Díaz",
    aula: "A-102",
    dia: "Miércoles",
    inicio: "08:00",
    fin: "09:40",
  },
  {
    codigo: "ADM-101",
    nombre: "Contabilidad General",
    docente: "Lic. Tomás Romero",
    aula: "C-301",
    dia: "Jueves",
    inicio: "13:00",
    fin: "14:40",
  },
  {
    codigo: "PSI-105",
    nombre: "Psicología del Desarrollo",
    docente: "Dra. Paola Santos",
    aula: "D-110",
    dia: "Viernes",
    inicio: "09:50",
    fin: "11:30",
  },
  {
    codigo: "GEN-130",
    nombre: "Metodología de la Investigación",
    docente: "MSc. José Herrera",
    aula: "A-205",
    dia: "Sábado",
    inicio: "08:00",
    fin: "09:40",
  },
];

const materiasContainer = document.getElementById("materiasContainer");
const matriculaForm = document.getElementById("matriculaForm");
const resumen = document.getElementById("resumen");
const tablaAsignacion = document.getElementById("tablaAsignacion");
const horarioSemanal = document.getElementById("horarioSemanal");

function cargarMaterias() {
  materiasContainer.innerHTML = ofertaAcademica
    .map(
      (m) => `
      <label class="materia-item">
        <span>
          <strong>${m.codigo} - ${m.nombre}</strong>
          <small>${m.dia} | ${m.inicio} - ${m.fin}</small>
        </span>
        <input type="checkbox" name="materia" value="${m.codigo}" />
      </label>
    `
    )
    .join("");
}

function minutosDesdeMedianoche(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function crearTabla(asignaciones) {
  const rows = asignaciones
    .map(
      (m) => `
      <tr>
        <td>${m.codigo}</td>
        <td>${m.nombre}</td>
        <td>${m.docente}</td>
        <td>${m.aula}</td>
        <td>${m.dia}</td>
        <td>${m.inicio} - ${m.fin}</td>
      </tr>
    `
    )
    .join("");

  tablaAsignacion.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Materia</th>
            <th>Docente asignado</th>
            <th>Aula asignada</th>
            <th>Día</th>
            <th>Horario</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function crearHorarioSemanal(asignaciones) {
  const ordenDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const ordenadas = [...asignaciones].sort(
    (a, b) => ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia)
  );

  horarioSemanal.innerHTML = ordenadas
    .map(
      (m) => `
      <article class="slot">
        <strong>${m.dia}: ${m.inicio} - ${m.fin}</strong>
        <div>${m.nombre}</div>
        <small>${m.docente} | Aula ${m.aula}</small>
      </article>
    `
    )
    .join("");
}

matriculaForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const matricula = document.getElementById("matricula").value.trim();
  const carrera = document.getElementById("carrera").value;
  const turno = document.getElementById("turno").value;

  const seleccionadas = Array.from(
    document.querySelectorAll('input[name="materia"]:checked')
  ).map((nodo) => nodo.value);

  if (seleccionadas.length < 2) {
    alert("Debes seleccionar al menos 2 materias para generar el horario.");
    return;
  }

  const asignaciones = ofertaAcademica.filter((m) => seleccionadas.includes(m.codigo));
  const salida = asignaciones.reduce((max, m) => {
    return minutosDesdeMedianoche(m.fin) > minutosDesdeMedianoche(max) ? m.fin : max;
  }, "00:00");

  resumen.classList.remove("vacío");
  resumen.innerHTML = `
    <strong>Estudiante:</strong> ${nombre} (${matricula})<br>
    <strong>Carrera:</strong> ${carrera} | <strong>Turno:</strong> ${turno}<br>
    <strong>Materias inscritas:</strong> ${asignaciones.length}<br>
    <strong>Hora estimada de salida:</strong> ${salida}
  `;

  crearTabla(asignaciones);
  crearHorarioSemanal(asignaciones);
});

cargarMaterias();
