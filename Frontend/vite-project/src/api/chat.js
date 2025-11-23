const BASE_URL = import.meta.env.VITE_CHAT_API_URL || 'http://127.0.0.1:5000'

async function postJson(path, body = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    return await res.json()
  } catch (err) {
    console.error('chat api error', err)
    throw err
  }
}

export async function sendChat(message) {
  const data = await postJson('/chat', { message })
  return data.response ?? data
}

export async function bookTable(name, people, time) {
  const data = await postJson('/book', { name, people, time })
  if (!data.ok) throw new Error(data.error || 'Booking failed')
  return data.message ?? data
}

export default { sendChat, bookTable }
