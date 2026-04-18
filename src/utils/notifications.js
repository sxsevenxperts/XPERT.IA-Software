/**
 * notifications.js — helpers para Notification API + Service Worker
 *
 * Compatível com browsers modernos e fallbacks seguros.
 * Nunca lança exceção: quando a API não existe, retorna 'unsupported' / false / null.
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function isServiceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * Retorna o estado atual da permissão de notificação.
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getPermissionStatus() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    return Notification.permission
  } catch {
    return 'unsupported'
  }
}

/**
 * Pede permissão e retorna true somente se concedida.
 * Caller pattern: `if (await requestNotificationPermission()) { ... }`
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch (err) {
    console.warn('requestNotificationPermission falhou:', err)
    return false
  }
}

/**
 * Registra o service worker em /sw.js. Retorna a Registration ou null.
 * @returns {Promise<ServiceWorkerRegistration | null>}
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch (err) {
    console.warn('registerServiceWorker falhou:', err)
    return null
  }
}

/**
 * Envia notificação local. Idempotente: retorna false silenciosamente se não suportado
 * ou sem permissão.
 * @returns {boolean} true se a notificação foi disparada
 */
export function sendLocalNotification(title, body, options = {}) {
  if (!isNotificationSupported()) return false
  try {
    if (Notification.permission !== 'granted') return false
    new Notification(title, { body, icon: '/icon-192.png', ...options })
    return true
  } catch (err) {
    console.warn('sendLocalNotification falhou:', err)
    return false
  }
}
