import { createContext, useContext, useEffect, useState } from 'react'
const SoundContext = createContext()
export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => localStorage.getItem('muted') === 'true')
  useEffect(() => { localStorage.setItem('muted', muted) }, [muted])
  return <SoundContext.Provider value={{ muted, setMuted }}>{children}</SoundContext.Provider>
}
export function useSound() { return useContext(SoundContext) }
