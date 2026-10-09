// js/semantico.js - Versión optimizada que reutiliza variables y termina en V1
class SemanticAnalyzer {
    constructor() {
        this.symbolTable = new Map();
        this.errors = [];
        this.warnings = [];
        this.intermediateCode = [];
        this.varCounter = 1;
        this.varMap = new Map(); // Mapeo de variables originales a Vn
        this.availableVars = new Set(); // Variables Vn disponibles para reusar
        this.usedVars = new Set(); // Variables Vn que están en uso
    }

    analyze(tokens, syntaxTrace) {
        this.reset();
        
        // Recolectar declaraciones
        this.collectDeclarations(tokens);
        
        // Auto-declarar variables no declaradas
        this.autoDeclareVariables(tokens);
        
        // Verificación semántica
        this.semanticValidation(tokens);
        
        // Generar advertencias
        this.generateWarnings();
        
        // Generar código intermedio optimizado
        this.generateIntermediateCode(tokens);
        
        return {
            symbolTable: Array.from(this.symbolTable.entries()),
            errors: this.errors,
            warnings: this.warnings,
            intermediateCode: this.intermediateCode,
            semanticTrace: this.generateSemanticTrace(tokens)
        };
    }

    reset() {
        this.symbolTable.clear();
        this.errors = [];
        this.warnings = [];
        this.intermediateCode = [];
        this.varCounter = 1;
        this.varMap.clear();
        this.availableVars.clear();
        this.usedVars.clear();
    }

    collectDeclarations(tokens) {
        const declaredVars = new Set();
        
        for (let i = 0; i < tokens.length; i++) {
            if (['int', 'float', 'char'].includes(tokens[i].type)) {
                const type = tokens[i].type;
                i++;
                
                while (i < tokens.length && tokens[i].type !== ';') {
                    if (tokens[i].type === 'id') {
                        const id = tokens[i].lexeme;
                        declaredVars.add(id);
                        
                        if (!this.symbolTable.has(id)) {
                            this.symbolTable.set(id, {
                                type: type,
                                declared: true,
                                used: false,
                                declarationLine: tokens[i].line,
                                declarationCol: tokens[i].col,
                                autoDeclared: false
                            });
                        }
                    }
                    i++;
                    if (i < tokens.length && tokens[i].type === ',') i++;
                }
            }
        }
        
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type === 'id' && 
                !declaredVars.has(tokens[i].lexeme) && 
                !this.symbolTable.has(tokens[i].lexeme)) {
                
                const id = tokens[i].lexeme;
                this.symbolTable.set(id, {
                    type: 'int',
                    declared: true,
                    used: false,
                    declarationLine: tokens[i].line,
                    declarationCol: tokens[i].col,
                    autoDeclared: true
                });
            }
        }
    }

    autoDeclareVariables(tokens) {
        // Ya se maneja en collectDeclarations
    }

    semanticValidation(tokens) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (this.isOperator(token.type) && i > 0 && i + 1 < tokens.length) {
                const leftToken = tokens[i - 1];
                const rightToken = tokens[i + 1];
                
                if ((leftToken.type === 'id' || leftToken.type === 'num') &&
                    (rightToken.type === 'id' || rightToken.type === 'num')) {
                    
                    const leftType = this.getTokenType(leftToken);
                    const rightType = this.getTokenType(rightToken);
                    
                    if (['+', '-', '*', '/'].includes(token.type)) {
                        if (!this.areTypesCompatibleForOperation(leftType, rightType)) {
                            this.errors.push({
                                type: 'semantic',
                                message: `Operación '${token.type}' no válida entre '${leftToken.lexeme}' (${leftType}) y '${rightToken.lexeme}' (${rightType})`,
                                line: token.line,
                                col: token.col,
                                severity: 'error'
                            });
                        }
                    }
                }
            }
            
            if (token.type === 'id') {
                if (this.symbolTable.has(token.lexeme)) {
                    this.symbolTable.get(token.lexeme).used = true;
                }
            }
        }
    }

    getTokenType(token) {
        if (token.type === 'id') {
            return this.symbolTable.has(token.lexeme) ? 
                   this.symbolTable.get(token.lexeme).type : 'unknown';
        } else if (token.type === 'num') {
            return token.lexeme.includes('.') ? 'float' : 'int';
        } else if (token.type === 'mensaje') {
            return 'char';
        }
        return 'unknown';
    }

    areTypesCompatibleForOperation(type1, type2) {
        if (type1 === 'unknown' || type2 === 'unknown') return true;
        
        const numericTypes = ['int', 'float'];
        
        if (numericTypes.includes(type1) && numericTypes.includes(type2)) {
            return true;
        }
        
        if (type1 === 'char' && type2 === 'char') {
            return true;
        }
        
        return false;
    }

    isOperator(type) {
        return ['+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!=', '++', '--'].includes(type);
    }

    generateWarnings() {
        this.symbolTable.forEach((info, id) => {
            if (!info.used && !info.autoDeclared) {
                this.warnings.push({
                    type: 'semantic',
                    message: `Variable '${id}' declarada pero nunca usada`,
                    line: info.declarationLine,
                    severity: 'warning'
                });
            }
        });
    }

    generateIntermediateCode(tokens) {
        this.intermediateCode = [];
        
        // Inicializar V1 como variable principal
        this.intermediateCode.push('// --- CÓDIGO INTERMEDIO OPTIMIZADO ---');
        this.intermediateCode.push('// Variables disponibles: V1, V2, V3...');
        this.intermediateCode.push('// El resultado final se almacena en V1');
        this.intermediateCode.push('');
        
        // Procesar asignaciones secuencialmente
        this.processAssignments(tokens);
        
        // Al final, asegurarse de que todo esté en V1
        if (this.varCounter > 1) {
            this.intermediateCode.push('');
            this.intermediateCode.push('// --- RESULTADO FINAL ---');
            this.intermediateCode.push('// Consolidando resultado en V1');
            
            // Buscar la última variable usada y moverla a V1 si es necesario
            const lastUsedVar = this.getLastUsedVariable();
            if (lastUsedVar !== 'V1') {
                this.intermediateCode.push(`V1 = ${lastUsedVar}; // Mover resultado final a V1`);
            }
        }
        
        this.intermediateCode.push('');
        this.intermediateCode.push('// --- FIN DEL PROGRAMA ---');
    }

    processAssignments(tokens) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.type === 'id' && i + 1 < tokens.length && tokens[i + 1].type === '=') {
                const targetVar = token.lexeme;
                let j = i + 2;
                let expressionTokens = [];
                
                // Capturar expresión
                while (j < tokens.length && tokens[j].type !== ';') {
                    expressionTokens.push(tokens[j]);
                    j++;
                }
                
                // Procesar esta asignación
                this.processSingleAssignment(targetVar, expressionTokens);
                
                i = j; // Saltar al final
            }
            // Procesar leer()
            else if (token.type === 'leer') {
                this.processReadStatement(tokens, i);
                i = this.skipToSemicolon(tokens, i);
            }
            // Procesar escribir()
            else if (token.type === 'escribir') {
                this.processWriteStatement(tokens, i);
                i = this.skipToSemicolon(tokens, i);
            }
            else {
                i++;
            }
        }
    }

    processSingleAssignment(targetVar, expressionTokens) {
        // Convertir expresión a string con nombres Vn
        let exprStr = '';
        const varsInExpression = new Set();
        
        for (const token of expressionTokens) {
            if (token.type === 'id') {
                let varName;
                
                if (this.varMap.has(token.lexeme)) {
                    varName = this.varMap.get(token.lexeme);
                } else {
                    // Asignar nueva variable Vn
                    varName = this.getAvailableVariable();
                    this.varMap.set(token.lexeme, varName);
                    this.usedVars.add(varName);
                    this.availableVars.delete(varName);
                }
                
                exprStr += varName + ' ';
                varsInExpression.add(varName);
            } else {
                exprStr += token.lexeme + ' ';
            }
        }
        
        exprStr = exprStr.trim();
        
        // Decidir dónde almacenar el resultado
        let resultVar;
        
        // ESTRATEGIA DE OPTIMIZACIÓN:
        // 1. Si la variable objetivo ya tiene un Vn asignado, usar ese
        if (this.varMap.has(targetVar)) {
            resultVar = this.varMap.get(targetVar);
        }
        // 2. Si hay una variable Vn disponible que no se usa en la expresión, reusarla
        else if (this.availableVars.size > 0) {
            for (const availVar of this.availableVars) {
                if (!varsInExpression.has(availVar)) {
                    resultVar = availVar;
                    this.availableVars.delete(availVar);
                    break;
                }
            }
        }
        // 3. Si no, asignar nueva variable Vn
        if (!resultVar) {
            resultVar = this.getNewVariable();
        }
        
        // Asignar el mapeo
        this.varMap.set(targetVar, resultVar);
        this.usedVars.add(resultVar);
        
        // Generar código
        const exprWithVars = this.replaceIdsWithVars(exprStr);
        this.intermediateCode.push(`${resultVar} = ${exprWithVars}; // ${targetVar} = ${exprStr}`);
        
        // Optimización: si una variable Vn ya no se usará, marcarla como disponible
        this.markUnusedVarsAsAvailable(targetVar, varsInExpression);
    }

    getAvailableVariable() {
        // Buscar variable Vn disponible para reusar
        for (let i = 1; i <= this.varCounter; i++) {
            const varName = `V${i}`;
            if (this.availableVars.has(varName)) {
                this.availableVars.delete(varName);
                return varName;
            }
        }
        
        // Si no hay disponibles, crear nueva
        return this.getNewVariable();
    }

    getNewVariable() {
        const varName = `V${this.varCounter}`;
        this.varCounter++;
        return varName;
    }

    replaceIdsWithVars(expression) {
        // Reemplazar nombres de variables por sus equivalentes Vn
        let result = expression;
        
        this.varMap.forEach((varName, originalName) => {
            const regex = new RegExp(`\\b${originalName}\\b`, 'g');
            result = result.replace(regex, varName);
        });
        
        return result;
    }

    markUnusedVarsAsAvailable(currentTarget, varsInExpression) {
        // Marcar variables Vn que ya no se usarán como disponibles
        
        // No marcar V1 como disponible (siempre debe estar en uso)
        this.availableVars.delete('V1');
        
        // Para cada variable mapeada
        this.varMap.forEach((varName, originalName) => {
            // Si no es la variable actual y no está en la expresión
            if (originalName !== currentTarget && 
                !this.isVariableStillUsed(originalName) &&
                varName !== 'V1') {
                
                this.availableVars.add(varName);
                this.usedVars.delete(varName);
            }
        });
    }

    isVariableStillUsed(varName) {
        // Verificar si una variable original aún se usará
        // (En una implementación real, esto requeriría análisis de flujo)
        // Por ahora, asumimos que todas las variables se usan
        return true;
    }

    processReadStatement(tokens, startIdx) {
        let i = startIdx + 2;
        let message = '';
        
        while (i < tokens.length && tokens[i].type !== ',') {
            if (tokens[i].type === 'mensaje') message = tokens[i].lexeme;
            i++;
        }
        
        if (tokens[i].type === ',') {
            i++;
            if (tokens[i].type === 'id') {
                const targetVar = tokens[i].lexeme;
                let varName;
                
                if (this.varMap.has(targetVar)) {
                    varName = this.varMap.get(targetVar);
                } else {
                    varName = this.getAvailableVariable();
                    this.varMap.set(targetVar, varName);
                    this.usedVars.add(varName);
                    this.availableVars.delete(varName);
                }
                
                this.intermediateCode.push(`// LEER: "${message}"`);
                this.intermediateCode.push(`${varName} = entrada(); // ${targetVar} = entrada()`);
            }
        }
    }

    processWriteStatement(tokens, startIdx) {
        let i = startIdx + 2;
        let message = '';
        
        while (i < tokens.length && tokens[i].type !== ',') {
            if (tokens[i].type === 'mensaje') message = tokens[i].lexeme;
            i++;
        }
        
        if (tokens[i].type === ',') {
            i++;
            if (tokens[i].type === 'id') {
                const sourceVar = tokens[i].lexeme;
                
                if (this.varMap.has(sourceVar)) {
                    const varName = this.varMap.get(sourceVar);
                    this.intermediateCode.push(`// ESCRIBIR: "${message}"`);
                    this.intermediateCode.push(`salida(${varName}); // Mostrar ${sourceVar}`);
                }
            }
        }
    }

    skipToSemicolon(tokens, startIdx) {
        let i = startIdx;
        while (i < tokens.length && tokens[i].type !== ';') {
            i++;
        }
        return i + 1;
    }

    getLastUsedVariable() {
        // Encontrar la última variable Vn que se usó
        // Por simplicidad, devolvemos la Vn con número más alto
        let maxNum = 1;
        
        this.usedVars.forEach(varName => {
            const num = parseInt(varName.substring(1));
            if (num > maxNum) maxNum = num;
        });
        
        return `V${maxNum}`;
    }

    generateSemanticTrace(tokens) {
        return []; // Para simplificar
    }
}

function semantico(tokens, syntaxTrace) {
    const analyzer = new SemanticAnalyzer();
    return analyzer.analyze(tokens, syntaxTrace);
}