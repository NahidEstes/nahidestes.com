import { useState } from 'react'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
import MagneticButton from '../ui/MagneticButton.jsx'

export default function ContactForm() {
  const [sent, setSent] = useState(false)
  const [fields, setFields] = useState({ name: '', email: '', message: '' })
  const { success } = useSoundEffects()

  const handleSubmit = (e) => {
    e.preventDefault()
    success()
    setSent(true)
  }

  const handleChange = (e) => {
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-accent-cyan text-sm mb-2">// TRANSMISSION_COMPLETE</p>
        <p className="text-2xl font-semibold mb-2">Message received ✓</p>
        <p className="text-text-muted">I'll get back to you within 24 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-xs text-text-muted mb-1 block">NAME</label>
          <input
            required
            name="name"
            value={fields.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
              outline-none focus:border-accent-cyan transition-colors text-text-primary placeholder:text-text-dim"
          />
        </div>
        <div>
          <label className="font-mono text-xs text-text-muted mb-1 block">EMAIL</label>
          <input
            required
            type="email"
            name="email"
            value={fields.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
              outline-none focus:border-accent-cyan transition-colors text-text-primary placeholder:text-text-dim"
          />
        </div>
      </div>
      <div>
        <label className="font-mono text-xs text-text-muted mb-1 block">MESSAGE</label>
        <textarea
          required
          name="message"
          value={fields.message}
          onChange={handleChange}
          placeholder="Tell me about your project..."
          rows="4"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
            outline-none focus:border-accent-cyan transition-colors text-text-primary
            placeholder:text-text-dim resize-none"
        />
      </div>
      <MagneticButton primary>
        Send Message →
      </MagneticButton>
    </form>
  )
}
