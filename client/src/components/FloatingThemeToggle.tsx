import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.button
        onClick={toggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative flex items-center gap-2 px-4 py-3 rounded-full
          shadow-xl backdrop-blur-md
          transition-all duration-300 ease-out
          ${theme === "light" 
            ? "bg-[#1F3A5F]/90 text-white hover:bg-[#1F3A5F] shadow-[#1F3A5F]/30" 
            : "bg-white/90 text-[#1F3A5F] hover:bg-white shadow-black/20"
          }
        `}
        data-testid="button-floating-theme-toggle"
      >
        <AnimatePresence mode="wait">
          {theme === "light" ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap text-sm font-medium"
            >
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </motion.span>
          )}
        </AnimatePresence>

        <div className={`
          absolute -inset-1 rounded-full opacity-0 transition-opacity duration-300
          ${isHovered ? "opacity-100" : ""}
          ${theme === "light" 
            ? "bg-gradient-to-r from-[#1F3A5F]/20 to-[#2FBF71]/20" 
            : "bg-gradient-to-r from-white/10 to-[#2FBF71]/10"
          }
          blur-lg -z-10
        `} />
      </motion.button>
    </motion.div>
  );
}

export default FloatingThemeToggle;
