#!/usr/bin/env node
/**
 * Script para generar bcrypt hashes de contraseñas
 * Uso en Supabase SQL editor para inserts seguros
 * 
 * Ejecutar:
 * node scripts/generate-bcrypt-hashes.js
 */

import bcrypt from 'bcryptjs'

async function generateHashes() {
  console.log('🔐 Generando bcrypt hashes para usuarios predeterminados...\n')

  const usuarios = [
    {
      email: 'supervisor@tandil.com',
      nombre: 'Supervisor Demo',
      password: 'supervisor123',
      rol: 'supervisor',
    },
    {
      email: 'admin@tandil.com',
      nombre: 'Administrador',
      password: 'admin123',
      rol: 'administrador',
    },
  ]

  const results = []

  for (const usuario of usuarios) {
    try {
      const hash = await bcrypt.hash(usuario.password, 10)
      results.push({
        ...usuario,
        hash,
      })

      console.log(`✅ ${usuario.email} (${usuario.rol})`)
      console.log(`   Password: ${usuario.password}`)
      console.log(`   Hash: ${hash}`)
      console.log()
    } catch (error) {
      console.error(`❌ Error generando hash para ${usuario.email}:`, error)
    }
  }

  console.log('━'.repeat(80))
  console.log('📋 SQL PARA INSERTAR EN SUPABASE:\n')

  console.log('INSERT INTO usuarios (email, nombre, contraseña_hash, rol, activo)')
  console.log('VALUES')

  const values = results
    .map(
      (r) =>
        `('${r.email}', '${r.nombre}', '${r.hash}', '${r.rol}', true)`,
    )
    .join(',\n')

  console.log(values + ';')

  console.log('\n━'.repeat(80))
  console.log(
    '📝 Copiar SQL arriba, ir a Supabase > SQL Editor > pegar > ejecutar (F5)\n',
  )
}

generateHashes().catch(console.error)
