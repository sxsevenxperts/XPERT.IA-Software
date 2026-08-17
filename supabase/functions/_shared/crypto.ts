const encoder = new TextEncoder()

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function getKey() {
  const seed = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!seed) throw new Error("CREDENTIALS_ENCRYPTION_KEY não configurada.")
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(seed))
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"])
}

export async function encryptSecret(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getKey()
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(value))
  return { ciphertext: toBase64(new Uint8Array(ciphertext)), iv: toBase64(iv) }
}

export async function decryptSecret(ciphertext: string, iv: string) {
  const key = await getKey()
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, key, fromBase64(ciphertext))
  return new TextDecoder().decode(plain)
}
