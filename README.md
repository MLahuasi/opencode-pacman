# Open Pac-Man: Spec Driven Development con OpenCode

Open Pac-Man es un juego de laberinto implementado con HTML, CSS y JavaScript sin dependencias. Su objetivo principal es servir como proyecto práctico para aplicar **Spec Driven Development (SDD)** con OpenCode: una funcionalidad se define, revisa, aprueba, implementa por pasos y valida antes de integrarse.

El código del juego es pequeño a propósito. El valor del repositorio está en el proceso reproducible que conecta problema, decisiones, especificación, código, Git y Pull Requests.

## Juego y ejecución local

### Funcionalidades actuales

- Laberinto de 28 x 31 tiles con túnel en la fila 14.
- Pac-Man controlado con las flechas del teclado.
- Puntos normales, cuatro Power Pellets y condición de victoria al recoger todos los consumibles.
- Blinky, Pinky, Inky y Clyde con comportamientos y salidas escalonadas.
- Power Pellets que otorgan 50 puntos, pulsan a Pac-Man y reproducen un tono breve.
- Modo asustado de 10 segundos, fantasmas comestibles, puntuación progresiva, textos flotantes y audio de captura.

### Tecnologías

- HTML5 y Canvas.
- CSS.
- JavaScript del navegador.
- Git y GitHub para el flujo de cambios.
- OpenCode y Skills para el flujo SDD.

No hay manifiesto de paquetes, compilación, linter ni suite de pruebas automatizada. El juego se sirve como contenido estático.

## Qué es Spec Driven Development

SDD trata la **spec** como el contrato principal de una funcionalidad. El código es la consecuencia de ese contrato, no su sustituto.

Una spec no es documentación decorativa. Versionada en Git, registra qué se construye, qué se excluye, qué estructuras se modificarán, cómo se implementa y cómo se comprueba. Si el código y la spec divergen, uno de los dos debe corregirse.

Este enfoque reduce decisiones implícitas. Una petición como “haz que los fantasmas se asusten” parece breve, pero exige decisiones sobre duración, colisiones, puntos, rutas, renderizado, audio, reinicios y casos límite. Sin una spec, el agente puede improvisarlas. Con una spec, esas decisiones se revisan antes de editar código.

### Principios

- Una spec describe una funcionalidad concreta, no un conjunto indefinido de ideas.
- El objetivo debe caber en una frase. Si no cabe, divide el problema.
- El alcance y las exclusiones son igual de importantes.
- La persona responsable aprueba la spec; el agente no se autoaprueba.
- Cada paso de implementación deja el sistema funcional y revisable.
- La aceptación se basa en criterios booleanos, no en frases como “funciona bien”.

## Skills, agentes y specs

### Skills

Una **Skill** es un conjunto reutilizable de instrucciones procedimentales para un agente. Define cuándo debe usarse una capacidad, qué contexto debe leer, qué decisiones pedir y qué resultado producir.

En este proyecto las Skills viven en `.agents/skills/`:

- `.agents/skills/spec/SKILL.md`: diseña una spec mediante preguntas de clarificación.
- `.agents/skills/spec-impl/SKILL.md`: implementa una spec aprobada en pasos revisables.
- `.agents/skills/pokemon-info/SKILL.md`: ejemplo de una Skill especializada no relacionada con SDD.

Una Skill no reemplaza el criterio humano ni contiene el estado de una funcionalidad. Contiene el procedimiento que el agente aplica de manera repetible.

### Agentes

Un **agente** es quien ejecuta las instrucciones y usa herramientas para leer archivos, editar, consultar Git, ejecutar comandos o pedir decisiones. OpenCode carga las Skills disponibles y puede invocarlas explícitamente, por ejemplo con `/spec` o `/spec-impl`.

Un agente puede usar varias Skills durante una sesión. La Skill proporciona el flujo especializado; el agente aporta el contexto del repositorio, las herramientas y la ejecución.

### Specs

Una **spec** es el artefacto persistente de una funcionalidad. Vive en `specs/NN-slug.md`, se revisa y se versiona junto con el código. A diferencia de una Skill, la spec no describe un método general: describe una decisión concreta del producto.

La relación es:

```text
Persona describe el problema
        |
        v
/spec + agente -> specs/NN-slug.md (Draft)
        |
        v
Persona revisa y cambia el estado a Approved
        |
        v
/spec-impl + agente -> rama spec-NN-slug + cambios por pasos
        |
        v
Validación, PR, merge y spec en estado Implemented
```

## Configuración del proyecto

| Archivo o directorio     | Responsabilidad                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `AGENTS.md`              | Memoria operativa: arquitectura, restricciones y forma de ejecutar o verificar el juego. |
| `.agents/skills/`        | Skills de proyecto que OpenCode puede cargar.                                            |
| `skills-lock.json`       | Registro de origen, ruta y hash de las Skills instaladas desde un paquete.               |
| `specs/`                 | Especificaciones numeradas y su historial de decisiones.                                 |
| `specs/.spec-config.yml` | Configuración del flujo de implementación.                                               |
| `src/`                   | Juego estático: entrada, reglas, renderizado y bucle.                                    |
