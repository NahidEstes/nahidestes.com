import { useState } from "react";
import { SoundProvider } from "./context/SoundContext.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import ScrollProgress from "./components/layout/ScrollProgress.jsx";
import CursorFollower from "./components/layout/CursorFollower.jsx";
import HeroSection from "./components/hero/HeroSection.jsx";
import AboutSection from "./components/about/AboutSection.jsx";
import SkillsSection from "./components/skills/SkillsSection.jsx";
import ProjectsSection from "./components/projects/ProjectsSection.jsx";
import TerminalSection from "./components/terminal/TerminalSection.jsx";
import ContactSection from "./components/contact/ContactSection.jsx";
import LoadingScreen from "./components/ui/LoadingScreen.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  return (
    <SoundProvider>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      <div
        style={{ opacity: loading ? 0 : 1, transition: "opacity 0.6s ease" }}
      >
        <ScrollProgress />
        <CursorFollower />
        <Navbar />
        <main>
          {/* HEro */}
          <HeroSection />
          <AboutSection />
          <SkillsSection />
          <ProjectsSection />
          <TerminalSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </SoundProvider>
  );
}
