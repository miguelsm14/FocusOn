# 🎯 FocusOn

<p align="center">
  <strong style="font-size: 1.25rem;">Productividad consciente para personas reales.</strong><br>
  <em>Organiza tu día sin la presión del 100% y cierra cada jornada sintiéndote realizado.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-~54-black?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-SQLite_Local-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/State-Zustand-443e38?style=flat-square" alt="Zustand" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## 💡 El Manifiesto: Por qué FocusOn

Las aplicaciones de productividad tradicionales suelen caer en la misma trampa: te piden programar cada minuto de tu vida o llenar listas interminables con 20 tareas diarias. Al llegar la noche, si solo tachaste 12, te vas a dormir con una sensación amarga de culpa e insuficiencia.

**FocusOn nace de una premisa opuesta:**  
> **No necesitas un día perfecto ni tachar una lista infinita. Necesitas cumplir lo que de verdad mueve la aguja y terminar el día en paz con tu esfuerzo.**

FocusOn es una aplicación móvil diseñada específicamente para quienes se saturan con la planificación rígida, tienden a posponer lo importante o terminan el día agotados pero con la sensación de "no haber hecho nada". Aquí cambiamos la obsesión por el porcentaje por una experiencia de **realización personal auténtica**.

---

## ✨ Pilares y Experiencia Actual

- 🎯 **Vista "Hoy" sin saturación**: Enfócate exclusivamente en lo prioritario de tu jornada actual. Menos ruido visual, mayor claridad mental.
- ⏰ **Recordatorios persistentes y seguimiento**: Olvídate de las notificaciones silenciosas que se descartan y se olvidan. FocusOn insiste con suavidad hasta que marques la tarea como completada.
- 🔥 **Rachas conscientes y Registro Diario (`daily_log`)**: Reconocimiento continuo del esfuerzo sostenido. Cada día cuenta, cada pequeño avance suma.
- 🔒 **100% Local y Privado (Offline-First)**: Tus planes y tus rutinas son solo tuyos. Todo se procesa y almacena localmente en SQLite sin telemetría invasiva.
- 🎨 **Diseño oscuro inmersivo & minimalista**: Una interfaz cuidada (Dark Mode con acentos violeta) pensada para reducir la fatiga visual y fomentar la concentración serena.

---

## 🔮 El Futuro de FocusOn (Roadmap de Visión)

Queremos que FocusOn evolucione hacia un **compañero inteligente de bienestar productivo**, alejándose de las herramientas frías de gestión corporativa.

```
       🌱 FASE 1                 🌿 FASE 2                 🌳 FASE 3                 ✨ FASE 4
 [Núcleo & Enfoque]  ──►  [Bienestar y Hábitos]  ──►  [Inteligencia Activa]  ──►  [Ecosistema & Widgets]
  • Base SQLite local       • Check-in nocturno        • Detección sobrecarga     • Widgets iOS / Android
  • Notificaciones persist. • Score de realización     • Poda sugerida tareas     • Backup cifrado local
  • Historial consistente   • Modos Focus / Pomodoro   • Hábitos atómicos         • Sincronización P2P
```

### 📍 Fase 1: Cimientos Sólidos & Enfoque Puro *(En desarrollo / Actual)*
- [x] Arquitectura React Native + Expo Router y base de datos SQLite nativa.
- [x] Clasificación intuitiva por prioridades (Alta, Media, Baja).
- [ ] Notificaciones inteligentes repetitivas por intervalos hasta el completado de tareas.
- [ ] Registro histórico blindado en `daily_log` para no perder estadísticas al limpiar tareas.
- [ ] Frases de enfoque contextual diario para empezar la mañana con claridad.

### 📍 Fase 2: Realización y Cierre Consciente *(Próximamente)*
- [ ] **Ritual de Cierre Diario ("Check-in de las 21:00")**: Un breve momento reflexivo para revisar el día, agradecer los avances y soltar lo pendiente sin remordimientos.
- [ ] **Métrica de Realización vs. Porcentaje Numérico**: Evaluar el día por el impacto de lo logrado y el balance personal, no por la cantidad bruta de checkboxes.
- [ ] **Temporizador de Foco Profundo**: Modo concentración sin distracciones para las tareas de alta prioridad.

### 📍 Fase 3: Asistente Anti-Sobrecarga *(Visión a Medio Plazo)*
- [ ] **Detección inteligente de sobrecarga**: Alertas proactivas si intentas programar más tareas de las humanamente asumibles en un día.
- [ ] **Sugerencia de posposición consciente ("Podar el día")**: Reorganización automática de tareas no esenciales para mañana con un solo toque y sin penalización moral.
- [ ] **Gestión de Hábitos Ligeros**: Hábitos que se adaptan a tus días difíciles con versiones mínimas viables ("los días bajos también cuentan").

### 📍 Fase 4: Ecosistema y Accesibilidad Total *(Visión a Largo Plazo)*
- [ ] **Widgets interactivos**: Pantalla de inicio y pantalla de bloqueo (iOS Dynamic Island & Android Live Updates).
- [ ] **Sincronización multi-dispositivo con cifrado Zero-Knowledge**: Conservando la filosofía de privacidad absoluta.
- [ ] **Soporte de voz rápida**: Captura de pensamientos y tareas en segundos para sacarlos de tu cabeza.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Propósito |
|---|---|---|
| **Framework** | [Expo](https://expo.dev/) (SDK ~54) | Entorno de desarrollo nativo y tooling multiplataforma |
| **Core** | [React Native](https://reactnative.dev/) (0.81) | Renderizado nativo de alto rendimiento en iOS y Android |
| **Enrutamiento** | [Expo Router](https://docs.expo.dev/router/introduction/) | Navegación basada en sistema de archivos |
| **Base de Datos** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Almacenamiento local relacional permanente y privado |
| **Gestión de Estado** | [Zustand](https://github.com/pmndrs/zustand) | Estado global reactivo, predecible y sin boilerplate |
| **Notificaciones** | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | Recordatorios locales programados e insistencia de seguimiento |
| **Utilidades de Fecha** | [date-fns](https://date-fns.org/) | Manejo preciso y modular de fechas y horarios |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Código tipado, mantenible y robusto |

---

## 🚀 Inicio Rápido en Desarrollo

### Requisitos previos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Git](https://git-scm.com/)
- Aplicación **Expo Go** en tu dispositivo físico (iOS / Android) o un emulador configurado.

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/FocusOn.git
   cd FocusOn
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npx expo start
   ```

4. **Ejecutar en tu dispositivo:**
   - Escanea el código QR desde la app **Expo Go** (Android) o desde la app Cámara (iOS).
   - O pulsa `a` para abrir en emulador de Android / `i` para simulador de iOS.

---

## 📐 Estructura del Proyecto

```
FocusOn/
├── app/                  # Rutas y vistas de Expo Router
│   ├── (tabs)/           # Pestañas principales (Hoy, Tareas, Stats, Config)
│   ├── task/             # Pantallas modales (Crear y Editar tarea)
│   └── _layout.tsx       # Inicialización de la DB y configuración de navegación
├── components/           # Componentes UI desacoplados y reutilizables
├── constants/            # Tokens de diseño (Colores, Temas, Mensajes diarios)
├── lib/                  # Servicios nativos (SQLite, Notificaciones programadas)
└── store/                # Estado global y acciones con Zustand
```

---

## 🤝 Contribuciones

FocusOn es un proyecto abierto a la comunidad. Si compartes la visión de una productividad más humana, empática y realista:

1. Haz un **Fork** del proyecto.
2. Crea tu rama de características (`git checkout -b feature/NuevaFuncionalidad`).
3. Confirma tus cambios (`git commit -m 'feat: añadir nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/NuevaFuncionalidad`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con convicción para ayudarte a cerrar cada día con la satisfacción de haber avanzado. 💜
</p>
