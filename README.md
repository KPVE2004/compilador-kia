# 🧩 KIA — Compilador Didáctico LR

Compilador didáctico que corre directamente en el navegador. Recibe código escrito en el lenguaje **KIA** y muestra, paso a paso, el **análisis léxico**, el **análisis sintáctico LR**, el **análisis semántico** (con tabla de símbolos y código intermedio) y los errores encontrados.

> **KIA** nace de las iniciales de los integrantes del equipo: **K**atia, **I**samar y **A**ngel.

Proyecto desarrollado en equipo en el Instituto Tecnológico de Jiquilpan.

---

## 👥 Equipo

| Integrante |
| ---------- |
| Katia Victoria |
| Isamar Chávez Díaz |
| Ángel de Jesús Canela Figueroa |

---

## ✨ Características

- **Editor integrado** con numeración de líneas, abrir/guardar archivos `.kia`, deshacer y rehacer.
- **Análisis léxico:** tabla de tokens generada a partir del código fuente.
- **Análisis sintáctico LR:** analizador con tabla combinada ACTION/GOTO y traza paso a paso del proceso.
- **Análisis semántico:** tabla de símbolos, código intermedio, traza semántica, advertencias y errores.
- **Reporte de errores** léxicos, sintácticos y semánticos en una pestaña dedicada.
- **Sin instalación:** es una aplicación web estática (HTML + CSS + JavaScript).

---

## 📸 Capturas

### Pantalla de inicio
![Pantalla inicial](docs/pantalla-inicial.png)

### Interfaz principal
![Pantalla principal](docs/pantalla-principal.png)

### Análisis léxico
![Análisis léxico](docs/analisis-lexico.png)

### Análisis sintáctico LR
![Análisis sintáctico](docs/analisis-sintactico.png)

### Reporte de errores
![Reporte de errores](docs/errores.png)

---

## 📝 El lenguaje KIA

| Elemento | Detalle |
| -------- | ------- |
| Tipos de dato | `int`, `float`, `char` |
| Declaración | `int a, b;` |
| Asignación | `a = 5 + 3 * 2;` |
| Expresiones | `+`, `-`, `*`, `/` y paréntesis |
| Condiciones | `<`, `>`, `<=`, `>=`, `==`, `!=` |
| Ciclo | `for (i = 0; i < 10; i++) ...` (también con `--`) |
| Selección | `switch (x) { case 1: ... break; default: ... }` |
| Entrada / salida | `leer('mensaje', x);` y `escribir('mensaje', x);` |

### Ejemplos

```
int a, b;
a = 5 + 3 * 2;
```

```
int i;
for (i = 0; i < 10; i++) i = i + 1;
```

---

## 🚀 Cómo ejecutarlo

No requiere instalación ni servidor.

1. Clona el repositorio:
   ```bash
   git clone https://github.com/USUARIO/NOMBRE-DEL-REPO.git
   cd NOMBRE-DEL-REPO
   ```
2. Abre `index.html` en tu navegador (doble clic, o con la extensión *Live Server* de VS Code).
3. Escribe o abre un programa `.kia` y presiona **Compilar**.

> Los íconos de la interfaz se cargan desde un CDN (Font Awesome), por lo que se necesita conexión a internet para verlos.

---

## 🗂️ Estructura del proyecto

```
├── index.html          # Interfaz principal
├── estilos.css         # Estilos de la aplicación
├── img/                # Logotipos
└── js/
    ├── lexico.js       # Analizador léxico
    ├── lr-parser.js    # Analizador sintáctico LR (tabla ACTION/GOTO)
    ├── semantico.js    # Analizador semántico, tabla de símbolos y código intermedio
    ├── compilador.js   # Orquesta el proceso de compilación y muestra resultados
    └── app.js          # Lógica del editor y de la interfaz
```

---

## 🛠️ Tecnologías

HTML5 · CSS3 · JavaScript (ES6) · Font Awesome

---

## 📌 Contexto académico

Proyecto de compiladores — Instituto Tecnológico de Jiquilpan.
