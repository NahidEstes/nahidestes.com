import { projects } from './projects.js'
export const commands = {
  help: () => ['Available commands:', '  whoami   - who am I?', '  skills   - core skills', '  projects - featured projects', '  contact  - get in touch', '  sudo     - try it ;)', '  coffee   - ☕', '  clear    - clear terminal'],
  whoami: () => ['Nahid Estes — Front-End Architect & UI/UX Engineer.', 'Specializing in React, motion design, and 3D web experiences.'],
  skills: () => ['React · TypeScript · Three.js · Tailwind · Node.js · GSAP · Framer Motion'],
  projects: () => projects.map(p => `- ${p.title}: ${p.desc}`),
  contact: () => ['Email: hello@nahidestes.dev', 'GitHub: github.com/nahidestes', 'LinkedIn: linkedin.com/in/nahidestes'],
  sudo: () => ['Permission denied: nice try though 😄'],
  coffee: () => ['☕ brewing... here you go!'],
  clear: () => null,
}
