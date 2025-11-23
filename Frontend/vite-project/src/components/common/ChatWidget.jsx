import React, { useState, useRef, useEffect } from 'react'
import styles from './ChatWidget.module.css'
import { sendChat, bookTable } from '../../api/chat.js'
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi'

const initialMessages = [
  { id: 1, from: 'bot', text: 'Hi! I am your assistant. Ask me about menu, bookings or opening hours.' },
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('chat') // 'chat' or 'book'
  const [bookName, setBookName] = useState('')
  const [bookPeople, setBookPeople] = useState(2)
  const [bookTime, setBookTime] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  const toggle = () => setOpen((v) => !v)

  const append = (from, text) => {
    setMessages((m) => [...m, { id: Date.now() + Math.random(), from, text }])
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input.trim()
    append('user', text)
    setInput('')
    setLoading(true)
    try {
      const reply = await sendChat(text)
      append('bot', String(reply))
    } catch (err) {
      append('bot', 'Sorry, something went wrong. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const resp = await bookTable(bookName, bookPeople, bookTime)
      append('bot', `Booking saved: ${resp}`)
      // optionally add to chat list as user action
      append('user', `Booking: ${bookName}, ${bookPeople} people, ${bookTime}`)
      setBookName('')
      setBookPeople(2)
      setBookTime('')
      setTab('chat')
      setOpen(true)
    } catch (err) {
      append('bot', `Booking failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.launcherWrap}>
        <button className={styles.launcher} onClick={toggle} aria-label="Open chat">
          {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
          {!open && <span className={styles.badge}>Chat</span>}
        </button>
      </div>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Chat widget">
          <div className={styles.header}>
            <div className={styles.title}>
              <FiMessageCircle /> <span>Help & Chat</span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.closeBtn} onClick={toggle} aria-label="Close"><FiX /></button>
            </div>
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'chat' ? styles.activeTab : ''}`} onClick={() => setTab('chat')}>Chat</button>
            <button className={`${styles.tab} ${tab === 'book' ? styles.activeTab : ''}`} onClick={() => setTab('book')}>Book a table</button>
          </div>

          {tab === 'chat' ? (
            <div className={styles.body}>
              <div className={styles.messages} ref={listRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`${styles.message} ${m.from === 'bot' ? styles.bot : styles.user}`}>
                    <div className={styles.bubble}>{m.text}</div>
                  </div>
                ))}
              </div>

              <div className={styles.inputRow}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a question..."
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={loading} aria-label="Send"><FiSend /></button>
              </div>
            </div>
          ) : (
            <form className={styles.body} onSubmit={handleBook}>
              <div className={styles.field}><label>Name</label><input value={bookName} onChange={(e) => setBookName(e.target.value)} required /></div>
              <div className={styles.field}><label>People</label><input type="number" min={1} value={bookPeople} onChange={(e) => setBookPeople(Number(e.target.value))} required /></div>
              <div className={styles.field}><label>Time</label><input value={bookTime} onChange={(e) => setBookTime(e.target.value)} placeholder="YYYY-MM-DD HH:MM" required /></div>
              <div className={styles.actionsRow}><button type="submit" className={styles.bookBtn} disabled={loading}>Book</button></div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
