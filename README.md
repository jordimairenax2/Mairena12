Este sistema está diseñado para la creación y configuración de horarios académicos desde coordinación, permitiendo:

- Registrar coordinaciones con sus carreras asociadas.
- Cargar materias por CSV y **adjuntarlas a una carrera específica**.
- Validar el CSV con formato `clase,año,créditos,categorías,compartida` (acepta `anio/creditos/categorias` sin tildes).
- Configurar docentes y asignarles especialidades/categorías.
- Configurar turnos con:
  - días activos,
  - prioridad por día,
  - hora de inicio,
  - minutos por bloque,
  - créditos por bloque,
  - hora de receso,
  - hora de almuerzo.
- Generar horario automático por año a partir del CSV adjunto y el turno seleccionado.

El desarrollo utiliza HTML, CSS y JavaScript para una interfaz web simple de configuración y operación.
