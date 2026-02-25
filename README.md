Este sistema está diseñado para la creación y configuración de horarios académicos desde coordinación, permitiendo:

- Registrar coordinaciones con sus carreras asociadas.
- Cargar materias por CSV y **adjuntarlas a una carrera específica**.
- Descargar una plantilla de CSV para acelerar la carga inicial.
- Validar el CSV con formato `clase,año,créditos,categorías,compartida` (también acepta separador `;` y encabezados sin tildes).
- Configurar docentes y asignarles especialidades/categorías.
- Configurar turnos con:
  - días activos,
  - prioridad por día,
  - hora de entrada,
  - minutos y créditos por bloque,
  - hora y duración del recreo,
  - hora y duración del almuerzo.
- Generar horario automático por año a partir del CSV adjunto y el turno seleccionado.
- Exportar el horario generado nuevamente a CSV.

El desarrollo utiliza HTML, CSS y JavaScript para una interfaz web simple de configuración y operación.
