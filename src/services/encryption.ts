/**
 * Servicio de encriptación para datos sensibles en IndexedDB
 * Usa SubtleCrypto (Web Crypto API)
 */

const ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
}

const ENCRYPTION_KEY_NAME = 'labores_encryption_key'

/**
 * Obtener o crear clave de encriptación
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyDB = await openKeyDB()
  const tx = keyDB.transaction(['keys'], 'readonly')
  const store = tx.objectStore('keys')

  return new Promise((resolve, reject) => {
    const request = store.get(ENCRYPTION_KEY_NAME)

    request.onerror = () => reject(request.error)
    request.onsuccess = async () => {
      const existingKey = request.result
      if (existingKey && existingKey.value) {
        // Importar key existente
        const key = await crypto.subtle.importKey(
          'jwk',
          existingKey.value,
          ALGORITHM,
          true,
          ['encrypt', 'decrypt'],
        )
        resolve(key)
      } else {
        // Generar nueva key
        const newKey = await crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt'])
        const exportedKey = await crypto.subtle.exportKey('jwk', newKey)

        // Guardar key en IndexedDB
        const txWrite = keyDB.transaction(['keys'], 'readwrite')
        const storeWrite = txWrite.objectStore('keys')
        storeWrite.put({
          name: ENCRYPTION_KEY_NAME,
          value: exportedKey,
        })

        resolve(newKey)
      }
    }
  })
}

/**
 * Abrir IndexedDB para almacenamiento de claves
 */
function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('labores_keys', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'name' })
      }
    }
  })
}

/**
 * Encriptar datos (JSON)
 */
export async function encryptData(data: unknown): Promise<string> {
  try {
    const key = await getEncryptionKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const jsonString = JSON.stringify(data)
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(jsonString)

    const ciphertext = await crypto.subtle.encrypt(ALGORITHM, key, encodedData)

    // Combinar IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)

    // Convertir a base64
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Error encriptando datos:', error)
    throw error
  }
}

/**
 * Desencriptar datos
 */
export async function decryptData<T = unknown>(encrypted: string): Promise<T> {
  try {
    const key = await getEncryptionKey()

    // Decodificar base64
    const combined = new Uint8Array(atob(encrypted).split('').map((c) => c.charCodeAt(0)))

    // Separar IV y ciphertext
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    // Configurar algoritmo con IV
    const algorithmWithIv = { ...ALGORITHM, iv }
    const decrypted = await crypto.subtle.decrypt(algorithmWithIv, key, ciphertext)

    // Convertir a string y parsear JSON
    const decoder = new TextDecoder()
    const jsonString = decoder.decode(decrypted)
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('Error desencriptando datos:', error)
    throw error
  }
}

/**
 * Encriptar un objeto en IndexedDB
 */
export async function encryptAndStore(
  dbName: string,
  storeName: string,
  key: IDBValidKey,
  data: unknown,
): Promise<void> {
  try {
    const encrypted = await encryptData(data)

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction([storeName], 'readwrite')
        const store = tx.objectStore(storeName)

        store.put({
          _key: key,
          _encrypted: encrypted,
          _timestamp: Date.now(),
        })

        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
    })
  } catch (error) {
    console.error('Error almacenando datos encriptados:', error)
    throw error
  }
}

/**
 * Recuperar y desencriptar datos de IndexedDB
 */
export async function decryptAndRetrieve<T = unknown>(
  dbName: string,
  storeName: string,
  key: IDBValidKey,
): Promise<T | null> {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName)

      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        const db = request.result
        const tx = db.transaction([storeName], 'readonly')
        const store = tx.objectStore(storeName)

        const getRequest = store.get(key)

        getRequest.onerror = () => reject(getRequest.error)
        getRequest.onsuccess = async () => {
          const result = getRequest.result
          if (!result || !result._encrypted) {
            resolve(null)
            return
          }

          try {
            const decrypted = await decryptData<T>(result._encrypted)
            resolve(decrypted)
          } catch (error) {
            console.error('Error desencriptando:', error)
            resolve(null)
          }
        }
      }
    })
  } catch (error) {
    console.error('Error recuperando datos encriptados:', error)
    return null
  }
}

/**
 * Limpiar datos encriptados de IndexedDB
 */
export async function clearEncryptedData(dbName: string, storeName: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction([storeName], 'readwrite')
      const store = tx.objectStore(storeName)

      store.delete(key)

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
  })
}

/**
 * Encriptar todos los datos sensibles en IndexedDB
 * Llamar periódicamente o al sincronizar
 */
export async function encryptAllOfflineData(): Promise<void> {
  console.log('🔐 Iniciando encriptación de datos offline...')

  // Aquí se pueden agregar más datos según necesario
  // Por ahora, mantener visible en consola
}
