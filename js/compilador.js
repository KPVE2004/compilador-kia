// js/compilador.js
// Coordinador principal del compilador LR

function compileCode() {
    const code = document.getElementById('code-area').value;
    
    if (!code.trim()) {
        showError('No hay código para compilar');
        return;
    }
    
    // Resetear resultados anteriores
    resetAnalysisResults();
    
    // Ejecutar análisis léxico
    const lexResult = lex(code);
    const tokens = lexResult.tokens;
    const lexErrors = lexResult.errors;
    
    // Mostrar resultados léxicos
    displayLexicalResults(tokens, code, lexErrors);
    
    // Si hay errores léxicos, mostrarlos y detener
    if (lexErrors.length > 0) {
        displayLexicalErrors(lexErrors);
        switchTab('errores');
        updateStatus('Errores léxicos encontrados');
        return;
    }
    
    // Ejecutar análisis sintáctico LR
    const syntaxResult = sintactico(tokens);
    
    // Mostrar resultados sintácticos
    displaySyntacticResults(syntaxResult);
    
    // Si hay errores sintácticos, mostrarlos y detener
    if (!syntaxResult.success) {
        showSyntaxErrors(syntaxResult.errors);
        switchTab('errores');
        updateStatus('Errores sintácticos encontrados');
        return;
    }
    
    // EJECUTAR ANÁLISIS SEMÁNTICO (NUEVO)
    const semanticResult = semantico(tokens, syntaxResult.trace);
    
    // Mostrar resultados semánticos
    displaySemanticResults(semanticResult, tokens);
    
    const semanticErrors = semanticResult.errors.filter(e => e.severity === 'error');
    
    if (semanticErrors.length === 0) {
        // Mostrar mensaje de éxito en lugar del modal
        showSuccessMessage();
        updateStatus('Compilación exitosa - Sin errores al compilar');
    } else {
        switchTab('semantico');
        updateStatus('Errores semánticos encontrados');
    }
}

// Mostrar mensaje de éxito sin errores
function showSuccessMessage() {
    const erroresTab = document.getElementById('errores-tab');
    erroresTab.innerHTML = `
        <div class="success-message">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle" style="font-size: 20px;"></i>
                <div>
                    <h3 style="margin: 0; font-size: 16px;">Sin errores al compilar</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">El código se ha compilado correctamente sin errores léxicos ni sintácticos.</p>
                </div>
            </div>
        </div>
    `;
    
    // También mostrar en análisis sintáctico si está activo
    const sintacticoTab = document.getElementById('sintactico-tab');
    if (sintacticoTab.querySelector('.success-message') === null) {
        const existingContent = sintacticoTab.innerHTML;
        sintacticoTab.innerHTML = `
            <div class="success-message">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle" style="font-size: 20px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 16px;">Análisis Sintáctico Exitoso</h3>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">El análisis LR se completó sin errores.</p>
                    </div>
                </div>
            </div>
            ${existingContent}
        `;
    }
}

// Mostrar errores léxicos
function displayLexicalErrors(lexErrors) {
    const erroresTab = document.getElementById('errores-tab');
    
    let errorsHtml = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i> 
            <strong>Errores Léxicos Encontrados</strong>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 15px;">
    `;
    
    lexErrors.forEach((error, index) => {
        errorsHtml += `
            <div style="padding: 8px; border-bottom: ${index < lexErrors.length - 1 ? '1px solid #dee2e6' : 'none'};">
                <strong>Error ${index + 1}:</strong> ${error.message} 
                <span style="color: #6c757d; font-size: 0.9em;">(Línea ${error.line}, Columna ${error.col})</span>
            </div>
        `;
    });
    
    errorsHtml += `</div>`;
    erroresTab.innerHTML = errorsHtml;
}

// Mostrar errores sintácticos
function showSyntaxErrors(syntaxErrors) {
    const erroresTab = document.getElementById('errores-tab');
    
    let errorsHtml = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i> 
            <strong>Errores Sintácticos Encontrados</strong>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 15px;">
    `;
    
    syntaxErrors.forEach((error, index) => {
        errorsHtml += `
            <div style="padding: 10px; border-bottom: ${index < syntaxErrors.length - 1 ? '1px solid #dee2e6' : 'none'};">
                <strong>Error ${index + 1}:</strong> ${error.message}
            </div>
        `;
    });
    
    errorsHtml += `</div>`;
    erroresTab.innerHTML = errorsHtml;
}

// Mostrar resultados léxicos
function displayLexicalResults(tokens, originalCode, lexErrors) {
    const tabContent = document.getElementById('lexico-tab');
    
    // Filtrar tokens para excluir el EOF
    const displayTokens = tokens.filter(token => token.type !== '$');
    
    if (displayTokens.length > 0) {
        tabContent.innerHTML = `
            <h3></i> Tabla de Tokens</h3>
            <table class="result-table">
                <thead>
                    <tr>
                        <th>Lexema</th>
                        <th>Tipo</th>
                        <th>Línea</th>
                        <th>Columna</th>
                    </tr>
                </thead>
                <tbody id="lexical-table-body">
                </tbody>
            </table>
            
            <div class="code-types-container">
                <h3><i class="fas fa-code"></i> Código con Tipos</h3>
                <div class="code-types-content">
${generateCodeWithTypes(tokens, originalCode)}
                </div>
            </div>
        `;
        
        const tableBody = document.getElementById('lexical-table-body');
        displayTokens.forEach(token => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(token.lexeme)}</td>
                <td>${escapeHtml(token.type)}</td>
                <td>${token.line}</td>
                <td>${token.col}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Generar código con tipos reemplazados
function generateCodeWithTypes(tokens, originalCode) {
    // Filtrar tokens para excluir el EOF
    const displayTokens = tokens.filter(token => token.type !== '$');
    
    if (displayTokens.length === 0) return '';
    
    // Crear un array de líneas para reconstruir el código
    const lines = originalCode.split('\n');
    const outputLines = [];
    
    // Procesar cada línea
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
        const lineTokens = displayTokens.filter(token => token.line === lineNum);
        
        if (lineTokens.length === 0) {
            outputLines.push(''); // Línea vacía
            continue;
        }
        
        let processedLine = '';
        
        // Ordenar tokens por posición en la línea
        lineTokens.sort((a, b) => a.col - b.col);
        
        // Reconstruir la línea solo con los tokens procesados
        for (let i = 0; i < lineTokens.length; i++) {
            const token = lineTokens[i];
            
            // Reemplazar el lexema por el tipo según las reglas
            let replacement = token.lexeme;
            
            // Reglas de reemplazo
            if (token.type === 'id') {
                replacement = 'id';
            } else if (token.type === 'num') {
                replacement = 'num';
            }
            // Para palabras reservadas y símbolos, mantener el original
            
            processedLine += replacement;
            
            // Agregar espacio después del token si no es el último y el siguiente token no está pegado
            if (i < lineTokens.length - 1) {
                const nextToken = lineTokens[i + 1];
                const currentEnd = token.col + token.lexeme.length - 1;
                const nextStart = nextToken.col - 1;
                
                // Si hay espacio entre tokens, agregar un espacio
                if (nextStart > currentEnd) {
                    processedLine += ' ';
                }
            }
        }
        
        outputLines.push(processedLine);
    }
    
    return outputLines.join('\n');
}

// Mostrar resultados sintácticos LR
function displaySyntacticResults(result) {
    const tabContent = document.getElementById('sintactico-tab');
    
    if (result.success) {
        tabContent.innerHTML = `
            <div class="success-message">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle" style="font-size: 20px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 16px;">Análisis Sintáctico LR Completado Exitosamente</h3>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">El código sigue correctamente la gramática definida</p>
                    </div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3>Proceso de Análisis LR</h3>
                <table class="result-table compact-table syntax-table">
                    <thead>
                        <tr>
                            <th>CADENA</th>
                            <th>PILA</th>
                            <th>ACCIÓN/REDUCCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${formatTraceAsLRTable(result.trace)}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        tabContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Errores en el Análisis Sintáctico</strong>
            </div>
            <div style="margin-top: 20px;">
                <h3>Proceso de Análisis (hasta el error)</h3>
                <table class="result-table compact-table syntax-table">
                    <thead>
                        <tr>
                            <th>CADENA</th>
                            <th>PILA</th>
                            <th>ACCIÓN/REDUCCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${formatTraceAsLRTable(result.trace)}
                    </tbody>
                </table>
            </div>
        `;
    }
}

function formatTraceAsLRTable(trace) {
    let tableRows = '';
    
    trace.forEach((step, index) => {
        // CADENA: Lo que queda por procesar - usar TIPO en lugar de lexema
        let cadena = '';
        if (step.lookahead && step.lookahead.type !== '$') {
            cadena = step.lookahead.type; // Usar el tipo ('id', 'num') en lugar del lexema
        } else {
            cadena = '$';
        }
        
        // PILA: Combinación de símbolos y estados - usar TIPOS en lugar de lexemas
        let pila = '$';
        if (step.symbolStack && step.stateStack) {
            pila += ` I${step.stateStack[0]}`;
            for (let i = 1; i < step.symbolStack.length; i++) {
                let symbol = step.symbolStack[i];
                
                // Convertir lexemas a tipos para mostrar
                if (symbol === 'x' || symbol === 'y' || symbol === 'z') {
                    symbol = 'id';
                } else if (!isNaN(symbol) && symbol !== '$') {
                    symbol = 'num';
                }
                // Para palabras reservadas (int, float, char) y símbolos (+, -, etc.) mantener igual
                
                pila += ` ${symbol} I${step.stateStack[i]}`;
            }
        }
        
        // ACCIÓN/REDUCCIÓN: Usar TIPOS en lugar de lexemas
        let accion = '';
        
        if (step.action === 'ACEPTAR - Análisis completado correctamente') {
            accion = 'ACEPTAR';
        } else if (step.action.startsWith('DESPLAZAR')) {
            const match = step.action.match(/estado (\d+)/);
            if (match) {
                const nextState = match[1];
                const currentState = step.stateStack[step.stateStack.length - 1];
                const symbolType = step.lookahead ? step.lookahead.type : '$'; // Usar tipo
                const symbolLexeme = step.lookahead ? step.lookahead.lexeme : '$';
                
                // Mostrar el tipo en lugar del lexema
                accion = `I${currentState}, ${symbolType} DESPLAZAMIENTO ${symbolType} a I${nextState}`;
            }
        } else if (step.action.startsWith('REDUCIR')) {
            const match = step.action.match(/P(\d+): (\w+) → (.+?)( y GOTO estado \d+)?$/);
            if (match) {
                const prodNum = match[1];
                const lhs = match[2];
                let rhs = match[3];
                if (rhs === '') rhs = 'ε';
                
                const currentState = step.stateStack[step.stateStack.length - 1];
                const symbolType = step.lookahead ? step.lookahead.type : '$'; // Usar tipo
                
                accion = `I${currentState}, ${symbolType} P${prodNum} ${lhs}→${rhs}`;
                
                if (match[4]) {
                    accion += match[4];
                }
            }
        } else {
            const currentState = step.stateStack[step.stateStack.length - 1];
            const symbolType = step.lookahead ? step.lookahead.type : '$'; // Usar tipo
            accion = `I${currentState}, ${symbolType}`;
        }
        
        tableRows += `
            <tr>
                <td style="font-family: 'Courier New', monospace; font-size: 11px;">${cadena}</td>
                <td style="font-family: 'Courier New', monospace; font-size: 11px;">${pila}</td>
                <td style="font-family: 'Courier New', monospace; font-size: 11px;">${accion}</td>
            </tr>
        `;
    });
    
    return tableRows;
}

// Mostrar resultados semánticos completos
function displaySemanticResults(semanticResult, tokens) {
    const tabContent = document.getElementById('semantico-tab');
    
    const errors = semanticResult.errors.filter(e => e.severity === 'error');
    const warnings = semanticResult.warnings || [];
    
    let html = '';
    
    // Mostrar tabla de proceso semántico
    if (semanticResult.semanticTrace && semanticResult.semanticTrace.length > 0) {
        html += `
            <div style="margin-bottom: 25px;">
                <h3><i class="fas fa-project-diagram"></i> Proceso de Análisis Semántico</h3>
                <div style="overflow-x: auto;">
                    <table class="result-table compact-table">
                        <thead>
                            <tr>
                                <th>ENTRADA</th>
                                <th>PILA</th>
                                <th>SALIDA</th>
                                <th>PILA SEMÁNTICA</th>
                                <th>PILA OPERADORES</th>
                                <th>CÓDIGO INTERMEDIO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${formatSemanticTrace(semanticResult.semanticTrace)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Mostrar código intermedio generado
    if (semanticResult.intermediateCode && semanticResult.intermediateCode.length > 0) {
        html += `
            <div style="margin-top: 25px;">
                <h3><i class="fas fa-code"></i> Código Intermedio Generado</h3>
                <div style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 6px; 
                    font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; 
                    white-space: pre-wrap; border: 1px solid #3a3a3a; margin: 0; overflow-x: auto;">
                    ${semanticResult.intermediateCode.join('\n')}
                </div>
                <p style="font-size: 12px; color: #6c757d; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> Nota: Las variables se nombran como V1, V2, V3... 
                    y se reusan cuando es posible para optimizar el código.
                </p>
            </div>
        `;
    }
    
    // Mostrar tabla de símbolos
    html += displaySymbolTable(semanticResult.symbolTable);
    
    // Mostrar errores y advertencias
    if (errors.length > 0) {
        html = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Errores Semánticos Encontrados</strong>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 15px; margin-bottom: 25px;">
                <p>Se encontraron ${errors.length} error(es) semántico(s):</p>
                ${errors.map((error, index) => `
                    <div style="padding: 8px; border-bottom: ${index < errors.length - 1 ? '1px solid #dee2e6' : 'none'};">
                        <strong>Error ${index + 1}:</strong> ${error.message} 
                        <span style="color: #6c757d; font-size: 0.9em;">(Línea ${error.line}${error.col ? `, Columna ${error.col}` : ''})</span>
                    </div>
                `).join('')}
            </div>
        ` + html;
    } else if (warnings.length > 0) {
        html = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #856404;">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Advertencias Semánticas</strong>
                </div>
                <div style="margin-top: 10px;">
                    <p>Se encontraron ${warnings.length} advertencia(s):</p>
                    ${warnings.map((warning, index) => `
                        <div style="padding: 8px; border-bottom: ${index < warnings.length - 1 ? '1px solid #ffeaa7' : 'none'};">
                            <strong>Advertencia ${index + 1}:</strong> ${warning.message} 
                            <span style="color: #856404; font-size: 0.9em;">(Línea ${warning.line})</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` + html;
    } else {
        html = `
            <div class="success-message">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle" style="font-size: 20px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 16px;">Análisis Semántico Exitoso</h3>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">No se encontraron errores semánticos en el código.</p>
                    </div>
                </div>
            </div>
        ` + html;
    }
    
    tabContent.innerHTML = html;
}

function formatSemanticTrace(semanticTrace) {
    if (!semanticTrace) return '';
    
    return semanticTrace.map(step => `
        <tr>
            <td style="font-family: 'Courier New', monospace; font-size: 10px;">${step.input || ''}</td>
            <td style="font-family: 'Courier New', monospace; font-size: 10px;">${step.stack || ''}</td>
            <td style="font-family: 'Courier New', monospace; font-size: 10px;">${step.output || ''}</td>
            <td style="font-family: 'Courier New', monospace; font-size: 10px;">[${(step.semanticStack || []).join(' ')}]</td>
            <td style="font-family: 'Courier New', monospace; font-size: 10px;">[${(step.operatorStack || []).join(' ')}]</td>
            <td style="font-family: 'Courier New', monospace; font-size: 10px;">${(step.intermediateCode || []).slice(-2).join('<br>')}</td>
        </tr>
    `).join('');
}

function displaySymbolTable(symbolTable) {
    if (!symbolTable || symbolTable.length === 0) {
        return `
            <div style="margin-top: 25px;">
                <h3><i class="fas fa-table"></i> Tabla de Símbolos</h3>
                <div class="info-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No se encontraron símbolos en el código.</p>
                </div>
            </div>
        `;
    }
    
    let tableHtml = `
        <div style="margin-top: 25px;">
            <h3><i class="fas fa-table"></i> Tabla de Símbolos</h3>
            <table class="result-table">
                <thead>
                    <tr>
                        <th>Identificador</th>
                        <th>Tipo</th>
                        <th>Línea Decl.</th>
                        <th>Columna Decl.</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    symbolTable.forEach(([id, info]) => {
        const status = info.used ? 'Usada' : 'No usada';
        const statusColor = info.used ? '#28a745' : '#ffc107';
        
        tableHtml += `
            <tr>
                <td>${escapeHtml(id)}</td>
                <td>${escapeHtml(info.type)}</td>
                <td>${info.declarationLine || 'N/A'}</td>
                <td>${info.declarationCol || 'N/A'}</td>
                <td style="color: ${statusColor}; font-weight: 500;">${status}</td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableHtml;
}

// Función para resetear resultados de análisis
function resetAnalysisResults() {
    // Resetear análisis sintáctico
    document.getElementById('sintactico-tab').innerHTML = `
        <div class="info-message">
            <i class="fas fa-hourglass-half"></i>
            <h3>Esperando compilación</h3>
            <p>El análisis sintáctico LR aparecerá aquí después de compilar el código</p>
        </div>
    `;

    // Resetear análisis léxico
    document.getElementById('lexico-tab').innerHTML = `
        <div class="info-message">
            <i class="fas fa-hourglass-half"></i>
            <h3>Esperando compilación</h3>
            <p>La tabla de tokens aparecerá aquí después de compilar el código</p>
        </div>
    `;

    // Resetear errores
    document.getElementById('errores-tab').innerHTML = `
        <div class="info-message">
            <i class="fas fa-hourglass-half"></i>
            <h3>Esperando compilación</h3>
            <p>Los errores aparecerán aquí después de compilar el código</p>
        </div>
    `;
    
    // NUEVO: Resetear análisis semántico
    document.getElementById('semantico-tab').innerHTML = `
        <div class="info-message">
            <i class="fas fa-hourglass-half"></i>
            <h3>Esperando compilación</h3>
            <p>El análisis semántico aparecerá aquí después de compilar el código</p>
        </div>
    `;
}

// Función para mostrar errores (para otros usos)
function showError(message) {
    document.getElementById('error-list').innerHTML = `<p>${message}</p>`;
    document.getElementById('error-modal').style.display = 'flex';
}

// Función auxiliar para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}