// js/lexico.js
// Analizador léxico actualizado para la nueva gramática

const KEYWORDS = new Set(["int", "float", "char", "break", "default", 
                          "leer", "escribir", "switch", "for", "case"]);
const SINGLE_TOKENS = {
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    '(': '(',
    ')': ')',
    ';': ';',
    '=': '=',
    ',': ',',
    ':': ':',
    '{': '{',
    '}': '}',
    '<': '<',
    '>': '>',
    '$': '$'
};

// Tokens de dos caracteres
const DOUBLE_TOKENS = {
    '<=': '<=',
    '>=': '>=',
    '==': '==',
    '!=': '!=',
    '++': '++',
    '--': '--'
};

function isLetter(ch){ return /[a-zA-Z]/.test(ch); }
function isDigit(ch){ return /[0-9]/.test(ch); }
function isUnderscore(ch){ return ch === '_'; }
function isWhitespace(ch){ return /\s/.test(ch); }
function isQuote(ch){ return ch === '"' || ch === "'"; }

function lex(inputText){
    let tokens = [];
    let errors = [];
    let i = 0;
    let line = 1;
    let col = 1;
    const len = inputText.length;

    function advance(n=1){
        for(let k=0;k<n;k++){
            if(i < len){
                if(inputText[i] === '\n'){ 
                    line++; 
                    col = 1; 
                    i++; 
                } else { 
                    i++; 
                    col++; 
                }
            }
        }
    }

    function addToken(type, lexeme, line, col) {
        tokens.push({type, lexeme, line, col});
    }

    while(i < len){
        let ch = inputText[i];

        // Skip whitespace
        if(isWhitespace(ch)){
            advance();
            continue;
        }

        // Comentarios de una línea (opcional)
        if (ch === '/' && i + 1 < len && inputText[i + 1] === '/') {
            while (i < len && inputText[i] !== '\n') {
                advance();
            }
            continue;
        }

        // Identifiers and keywords
        if(isLetter(ch) || isUnderscore(ch)){
            let startLine = line, startCol = col;
            let lexeme = "";
            while(i < len && (isLetter(inputText[i]) || isDigit(inputText[i]) || isUnderscore(inputText[i]))){
                lexeme += inputText[i];
                advance();
            }
            
            // Convert to lowercase for case-insensitive matching
            const lowerLexeme = lexeme.toLowerCase();
            if(KEYWORDS.has(lowerLexeme)){
                addToken(lowerLexeme, lexeme, startLine, startCol);
            } else {
                addToken('id', lexeme, startLine, startCol);
            }
            continue;
        }

        // Numbers
        if(isDigit(ch)){
            let startLine = line, startCol = col;
            let num = "";
            while(i < len && isDigit(inputText[i])){
                num += inputText[i];
                advance();
            }
            addToken('num', num, startLine, startCol);
            continue;
        }

        // Comillas simples o dobles como tokens individuales
        if(ch === "'" || ch === '"'){
            let startLine = line, startCol = col;
            addToken("'", ch, startLine, startCol);
            advance();
            
            // Capturar el contenido hasta la siguiente comilla
            let str = "";
            let contentStartLine = line, contentStartCol = col;
            while(i < len && inputText[i] !== ch){
                str += inputText[i];
                advance();
            }
            
            // Agregar el contenido como token 'mensaje'
            if(str.length > 0){
                addToken('mensaje', str, contentStartLine, contentStartCol);
            }
            
            // Agregar la comilla de cierre
            if(i < len && inputText[i] === ch){
                addToken("'", inputText[i], line, col);
                advance();
            } else {
                errors.push({
                    message: `Cadena sin cerrar`,
                    line: startLine,
                    col: startCol
                });
            }
            continue;
        }

        // Tokens de dos caracteres
        if (i + 1 < len) {
            const twoChar = ch + inputText[i + 1];
            if (twoChar in DOUBLE_TOKENS) {
                addToken(DOUBLE_TOKENS[twoChar], twoChar, line, col);
                advance(2);
                continue;
            }
        }

        // Single-character tokens
        if(ch in SINGLE_TOKENS){
            addToken(SINGLE_TOKENS[ch], ch, line, col);
            advance();
            continue;
        }

        // Unknown character
        errors.push({
            message: `Carácter inválido '${ch}'`,
            line: line,
            col: col
        });
        advance();
    }

    // Add EOF token
    addToken('$', '$', line, col);

    return {tokens, errors};
}