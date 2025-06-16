import { useEffect, useState } from "react";
import * as React from "react";
export function GradientBackground({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen font-montserrat overflow-hidden">
      {/* Light mode gradient */}
      <div className="absolute inset-0 z-0 transition-opacity duration-700"
           style={{ opacity: isDark ? 0 : 1,
                    background: "linear-gradient(to bottom right, #eef2ff, #f3e8ff, #cffafe)" }} />
      {/* Dark mode gradient */}
      <div className="absolute inset-0 z-0 transition-opacity duration-700"
           style={{ opacity: isDark ? 1 : 0,
                    background: "linear-gradient(to bottom right, #111827, #6d28d9, #3730a3)" }} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
