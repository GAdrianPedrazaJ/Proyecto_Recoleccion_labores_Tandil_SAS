# ⚙️ Guía Capacitor - Distribuir en Google Play

## Opción más fácil para Google Play: **Capacitor**

Capacitor convierte tu PWA en una APK que puedes distribuir en Google Play.

---

## 🚀 Paso 1: Instalar Capacitor

```bash
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/android @capacitor/ios
```

---

## 🎯 Paso 2: Inicializar Capacitor

```bash
npx cap init
```

Te pedirá:
- **App name:** `Labores Tandil`
- **App Package ID:** `com.tandil.labores` (ej: com.nombreempresa.labores)
- **Webapp directory:** `dist`  ← IMPORTANTE

---

## 📦 Paso 3: Build y Sincronizar

```bash
# Build la app React
npm run build

# Agregar soporte Android
npx cap add android

# Sincronizar archivos
npx cap sync
```

---

## 📱 Paso 4: Abrir y Configurar en Android Studio

```bash
# Abre Android Studio automáticamente
npx cap open android
```

**En Android Studio:**

1. Esperar a que sincronice Gradle
2. Seleccionar: `Build > Generate Signed Bundle / APK`
3. Elegir **APK** (para probar) o **Bundle** (para Google Play)

---

## 🔑 Paso 5: Crear Keystore (para firmar APK)

⚠️ **Necesario para Google Play**

```bash
keytool -genkey -v -keystore labores.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias labores
```

Guarda este archivo `.keystore` **en lugar seguro** y NO lo compartas.

---

## 📤 Paso 6: Subir a Google Play

1. Ir a [Google Play Console](https://play.google.com/console)
2. Crear nueva aplicación
3. Subir APK/Bundle firmado
4. Completar ficha técnica (descripciones, screenshots, etc.)
5. Enviar para revisión

---

## 🔄 Actualizaciones futuras

Cuando actualices tu app:

```bash
# Cambios en React
npm run build
npx cap sync

# En Android Studio: Build > Generate Signed Bundle / APK
```

---

## 📝 Configuración recomendada en `capacitor.config.json`

```json
{
  "appId": "com.tandil.labores",
  "appName": "Labores Tandil",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    }
  }
}
```

---

## ⚠️ Requisitos del sistema:

- **Android SDK** - Nivel 23 o superior
- **Java 17+**
- **Android Studio** (recomendado)
- **Node.js** v14+

---

## 🎓 Alternativa más simple: Progressive Web App

Si solo quieres que se instale desde el navegador:
- **No necesita Capacitor**
- **Los usuarios** instalan desde Chrome: `Instalar Labores Tandil`
- **Funciona offline** automáticamente
- Ya está configurado en tu proyecto ✅

**¿Cuál opción prefieres?**
1. Solo PWA instalable desde navegador (más fácil) ✅
2. APK completa para Google Play (requiere más pasos)
