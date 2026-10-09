// js/app.js
// Manejo de la interfaz de usuario y eventos

// Variables globales
let currentFile = null;
let fileHandle = null;
let isModified = false;

// Hacer updateLineNumbers global
function updateLineNumbers() {
    const codeArea = document.getElementById('code-area');
    const lineNumbers = document.getElementById('line-numbers');
    const lineCount = document.getElementById('line-count');
    
    const lines = codeArea.value.split('\n');
    let numbers = '';
    
    // Crear números de línea simples sin duplicados
    for (let i = 1; i <= lines.length; i++) {
        numbers += i + '\n';
    }
    
    lineNumbers.textContent = numbers;
    lineCount.textContent = `${lines.length} línea${lines.length !== 1 ? 's' : ''}`;
    
    // Sincronizar scroll
    lineNumbers.scrollTop = codeArea.scrollTop;
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Navegación entre pantallas
    document.getElementById('pantalla-inicial').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('pantalla-principal').style.display = 'flex';
        // Actualizar números de línea al mostrar la pantalla principal
        setTimeout(updateLineNumbers, 100);
    });

    // Configurar eventos del editor
    setupEditorEvents();
});

// Funciones de la aplicación
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function newFile() {
    if (isModified && !confirm('¿Desea descartar los cambios sin guardar?')) {
        return;
    }
    
    document.getElementById('code-area').value = '';
    document.getElementById('filename').textContent = 'sin_titulo.kia';
    currentFile = null;
    fileHandle = null;
    isModified = false;
    resetAnalysisResults();
    updateLineNumbers();
    updateStatus('Nuevo archivo creado');
}

async function openFile() {
    const fileInput = document.getElementById('file-input');
    fileInput.value = ''; // Limpiar selección previa
    
    // Crear una promesa para manejar la selección
    return new Promise((resolve) => {
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                // Verificar extensión .kia
                if (!file.name.toLowerCase().endsWith('.kia')) {
                    showError('Solo se permiten archivos con extensión .kia');
                    fileInput.value = ''; // Limpiar el input
                    resolve();
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('code-area').value = e.target.result;
                    document.getElementById('filename').textContent = file.name;
                    currentFile = file.name;
                    fileHandle = null;
                    isModified = false;
                    resetAnalysisResults();
                    updateLineNumbers();
                    updateStatus(`Archivo ${file.name} cargado`);
                    resolve();
                };
                reader.onerror = function() {
                    showError('Error al leer el archivo');
                    resolve();
                };
                reader.readAsText(file);
            } else {
                resolve();
            }
        };
        
        // Disparar el click en el input file
        fileInput.click();
    });
}

async function saveFile() {
    const content = document.getElementById('code-area').value;
    
    // Validar que hay contenido para guardar
    if (!content.trim()) {
        showError('No hay contenido para guardar');
        return;
    }
    
    try {
        // Si ya tenemos un fileHandle, guardar directamente en el mismo archivo
        if (fileHandle) {
            await saveToFileHandle(fileHandle, content);
            isModified = false;
            document.getElementById('filename').textContent = currentFile;
            updateStatus(`Archivo ${currentFile} guardado`);
            return;
        }
        
        // Si no tenemos fileHandle (archivo abierto con input tradicional o nuevo)
        // Usar "Guardar como" para elegir ubicación
        await saveAsFile();
        
    } catch (error) {
        console.error('Error al guardar:', error);
        showError('Error al guardar el archivo: ' + error.message);
    }
}

async function saveAsFile() {
    const content = document.getElementById('code-area').value;
    
    // Validar que hay contenido para guardar
    if (!content.trim()) {
        showError('No hay contenido para guardar');
        return;
    }
    
    try {
        // Usar File System Access API para guardar
        if ('showSaveFilePicker' in window) {
            const suggestedName = currentFile || 'sin_titulo.kia';
            const newFileHandle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [{
                    description: 'Archivos KIA',
                    accept: {
                        'text/plain': ['.kia']
                    }
                }]
            });
            
            await saveToFileHandle(newFileHandle, content);
            
            // Actualizar estado
            const file = await newFileHandle.getFile();
            fileHandle = newFileHandle;
            currentFile = file.name;
            document.getElementById('filename').textContent = file.name;
            isModified = false;
            updateStatus(`Archivo ${file.name} guardado`);
        } else {
            // Fallback para navegadores que no soportan File System Access API
            const filename = prompt('Ingrese el nombre del archivo:', currentFile || 'sin_titulo.kia');
            if (filename) {
                let finalFilename = filename.endsWith('.kia') ? filename : filename + '.kia';
                saveWithDownload(finalFilename, content);
            }
        }
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error al guardar como:', error);
            showError('Error al guardar el archivo: ' + error.message);
        }
    }
}

async function saveToFileHandle(fileHandle, content) {
    // Crear un FileSystemWritableFileStream para escribir
    const writable = await fileHandle.createWritable();
    // Escribir el contenido del archivo
    await writable.write(content);
    // Cerrar el archivo
    await writable.close();
}

function saveWithDownload(filename, content) {
    // Método fallback usando descarga
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Actualizar estado
    document.getElementById('filename').textContent = filename;
    currentFile = filename;
    isModified = false;
    updateStatus(`Archivo ${filename} guardado (descargado)`);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeApp() {
    if (isModified && !confirm('Tiene cambios sin guardar. ¿Está seguro de que quiere salir?')) {
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres salir?')) {
        document.getElementById('pantalla-principal').style.display = 'none';
        document.getElementById('pantalla-inicial').style.display = 'flex';
    }
}

function closeFile() {
    if (isModified && !confirm('Tiene cambios sin guardar. ¿Está seguro de que quiere cerrar el archivo?')) {
        return;
    }
    
    if (confirm('¿Cerrar el archivo actual?')) {
        newFile();
    }
}

function undo() {
    document.execCommand('undo');
    updateStatus('Deshacer');
}

function redo() {
    document.execCommand('redo');
    updateStatus('Rehacer');
}

function showHelp() {
    alert('Compilador Didáctico LR\n\nGramática soportada:\n- Declaraciones: int id, id; float id; char id;\n- Asignaciones: id = expresión;\n- Expresiones aritméticas con + - * / ( )\n\nAtajos:\n- Ctrl+S: Guardar\n- Ctrl+Shift+S: Guardar como\n- Ctrl+N: Nuevo archivo\n- Ctrl+O: Abrir archivo');
}

function updateStatus(message) {
    document.getElementById('status-message').textContent = message;
}

// Configuración de eventos del editor
function setupEditorEvents() {
    const codeArea = document.getElementById('code-area');
    const lineNumbers = document.getElementById('line-numbers');

    // Los eventos ahora usan la función global updateLineNumbers
    codeArea.addEventListener('input', updateLineNumbers);
    codeArea.addEventListener('scroll', function() {
        lineNumbers.scrollTop = this.scrollTop;
    });

    // Soporte para tabulación
    codeArea.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            updateLineNumbers();
        }
        
        // Atajos de teclado
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        saveAsFile();
                    } else {
                        saveFile();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    newFile();
                    break;
                case 'o':
                    e.preventDefault();
                    openFile();
                    break;
            }
        }
    });

    // Detectar cambios para marcar como modificado
    codeArea.addEventListener('input', function() {
        isModified = true;
        if (currentFile) {
            document.getElementById('filename').textContent = currentFile + ' *';
        } else {
            document.getElementById('filename').textContent = 'sin_titulo.kia *';
        }
    });

    // Actualizar posición del cursor
    codeArea.addEventListener('click', updateCursorPosition);
    codeArea.addEventListener('keyup', updateCursorPosition);

    function updateCursorPosition() {
        const text = codeArea.value.substring(0, codeArea.selectionStart);
        const lines = text.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        document.getElementById('cursor-position').textContent = `Ln ${line}, Col ${col}`;
    }

    // Inicializar
    updateLineNumbers();
    updateCursorPosition();
}