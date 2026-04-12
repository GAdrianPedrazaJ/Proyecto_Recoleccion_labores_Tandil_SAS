# 📱 Instalación de PWA - Labores Tandil

Tu aplicación está configurada como **Progressive Web App (PWA)** que se puede instalar en celular.

## ✅ Requisitos cumplidos:

✓ **Manifest.json** configurado correctamente  
✓ **Service Worker** para funcionamiento offline  
✓ **Iconos** en múltiples resoluciones (192x192 y 512x512)  
✓ **Meta tags** para iOS y Android  
✓ **VitePWA plugin** configurado con caché y sincronización  

---

## 📲 OPCIÓN 1: Instalar desde el navegador (RECOMENDADO)

### En Android (Chrome, Edge, Brave):

1. **Desplegar (build) tu app:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Acceder desde el celular:** Ir a `http://tu-ip:4173`

3. **Al abrir el navegador:**
   - Chrome mostrará un **banner de instalación** automáticamente
   - O usa el icono `⬇️ Instalar` / `Agregar a pantalla de inicio`

4. **Listo:** La app estará disponible como una aplicación nativa

### En iOS (Safari):

1. Abrir en Safari la URL de tu app
2. Tocar el icono **Compartir** (cuadro con flecha)
3. Seleccionar **"Agregar a pantalla de inicio"**
4. Nombrar la app y confirmar

---

## 🌐 OPCIÓN 2: Distribuir en Google Play (APK/AAB)

Para distribuir como aplicación real en Google Play necesitas **Capacitor** o **Cordova**.

### Pasos generales con Capacitor:

```bash
# 1. Instalar Capacitor
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/android @capacitor/ios

# 2. Inicializar Capacitor
npx cap init

# 3. Hacer build de la app
npm run build

# 4. Agregar plataforma Android
npx cap add android

# 5. Sincronizar archivos
npx cap sync

# 6. Abrir Android Studio (si tienes)
npx cap open android
```

**Nota:** Capacitor requiere Android Studio/SDK y keystore para firmar APKs.

---

## 🔧 Características PWA actuales:

✅ **Offline primero** - Funciona sin conexión  
✅ **Caché inteligente** - Assets estáticos guardados 30 días  
✅ **API sincronizada** - NetworkFirst (datos frescos con fallback)  
✅ **Instalable** - Agregar a pantalla de inicio  
✅ **Full-screen** - Se ve como app nativa  
✅ **Push notifications** - Listo para implementar  

---

## 🚀 Comandos importantes:

```bash
# Development
npm run dev

# Build para producción
npm run build

# Preview del build (como se vería en producción)
npm run preview

# Lint
npm run lint
```

---

## 📋 Checklist antes de distribuir:

- [ ] App funciona offline (ver Console de DevTools)
- [ ] Iconos se cargan correctamente
- [ ] Se puede instalar (banner aparece en Chrome)
- [ ] Funciona en conexión lenta (Network throttling en DevTools)
- [ ] HTTPS configurado en producción (obligatorio para PWA)

---

## 🔐 IMPORTANTE para producción:

⚠️ **Las PWAs requieren HTTPS**

Tu app debe estar en un dominio con certificado SSL:
- Usar Supabase, Azure, Vercel, Netlify o similar
- No funciona en `http://` local (solo en localhost)

---

## 📞 Soporte para Google Play:

Si necesitas distribuir como APK real en Google Play:
- Usa **Capacitor** (recomendado) o Cordova
- Requiere firma certificada
- Costo de Google Play Developer Account: $25 USD única vez
- Revisar políticas de Google Play

**¿Quieres ayuda configurando Capacitor?**
