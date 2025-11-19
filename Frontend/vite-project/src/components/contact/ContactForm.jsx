import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { apiClient } from '../../services/apiClient.js'
import Button from '../common/Button.jsx'
import styles from './ContactForm.module.css'

const ContactForm = () => {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const { mutateAsync, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: apiClient.submitContact,
    onSuccess: () => {
      setFormValues({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    },
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await mutateAsync(formValues)
    } catch {
      // errors surface via mutation state
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label htmlFor="name">Name (min 2 characters)</label>
          <input id="name" name="name" value={formValues.name} onChange={handleChange} required minLength={2} />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={formValues.email} onChange={handleChange} required />
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="subject">Subject (min 3 characters)</label>
        <input id="subject" name="subject" value={formValues.subject} onChange={handleChange} required minLength={3} />
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="message">Message (min 10 characters)</label>
        <textarea id="message" name="message" rows="4" value={formValues.message} onChange={handleChange} required minLength={10} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send message'}
      </Button>
      {isSuccess && <p className={styles.success}>Message sent! We will reply soon.</p>}
      {isError && <p className={styles.error}>{error.message}</p>}
    </form>
  )
}

export default ContactForm

