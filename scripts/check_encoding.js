const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../src/pages/NuevoRegistro.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Show what's around "Guardar Registro Completo"
const idx = content.indexOf('Guardar Registro Completo')
console.log('Surrounding context:')
console.log(JSON.stringify(content.slice(idx - 30, idx + 30)))
