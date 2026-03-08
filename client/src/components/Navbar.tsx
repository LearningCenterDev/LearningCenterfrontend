import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logoImage from "@assets/learn_1763122469047.png";

import Favicon from "@assets/Favicon.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { name: "Home", href: "/", testId: "link-home" },
    { name: "Courses", href: "/courses", testId: "link-courses" },
    { name: "Resources", href: "/resources", testId: "link-resources" },
    { name: "About", href: "/about", testId: "link-about" },
    { name: "Contact", href: "/contact", testId: "link-contact" },
  ];

  return (
    <>
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white shadow-xl shadow-[#1F3A5F]/10' 
            : 'bg-white/95 backdrop-blur-sm shadow-lg shadow-[#1F3A5F]/5'
        }`}
      >
        {/* Premium top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#2FBF71] via-[#3dd88a] to-[#2FBF71]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group" data-testid="link-logo">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2FBF71]/10 rounded-full blur-md group-hover:bg-[#2FBF71]/20 transition-all"></div>
                <img 
                  src={Favicon} 
                  alt="Alloria Learning Center logo" 
                  className="w-12 h-12 relative z-10 transition-transform group-hover:scale-105" 
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg sm:text-xl text-[#1F3A5F] tracking-tight">
                  Alloria Learning Center
                </span>
                <span className="text-[10px] text-[#2FBF71] font-medium tracking-widest uppercase hidden sm:block">
                  Empowering Young Minds
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  data-testid={l.testId}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all group ${
                    location === l.href 
                      ? 'text-[#2FBF71]'
                      : 'text-[#1F3A5F]/85 hover:text-[#1F3A5F]'
                  }`}
                >
                  {l.name}
                  {/* Active indicator */}
                  {location === l.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#2FBF71] rounded-full"></span>
                  )}
                  {/* Hover effect */}
                  <span className="absolute inset-0 bg-[#1F3A5F]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </Link>
              ))}
              
              {/* Login Button */}
              <Link href="/login" className="ml-3">
                <Button
                  className="bg-gradient-to-r from-[#2FBF71] to-[#25a060] hover:from-[#25a060] hover:to-[#1f8a50] text-white font-semibold shadow-lg shadow-[#2FBF71]/25 hover:shadow-[#2FBF71]/40 transition-all border-0 px-5"
                  data-testid="button-nav-login"
                >
                  <UserRound className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((s) => !s)}
              className="md:hidden text-[#1F3A5F] hover:bg-[#1F3A5F]/10 border border-[#1F3A5F]/10"
              data-testid="button-menu-toggle"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-[#2FBF71]/20 overflow-hidden"
            >
              {links.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  onClick={() => {
                    setOpen(false);
                    window.scrollTo(0, 0);
                  }}
                  data-testid={`mobile-${l.testId}`}
                  className={`flex items-center gap-3 px-6 py-4 border-b border-[#1F3A5F]/5 transition-colors ${
                    location === l.href 
                      ? 'text-[#2FBF71] font-semibold bg-[#2FBF71]/5' 
                      : 'text-[#1F3A5F]/90 hover:bg-[#1F3A5F]/5 hover:text-[#1F3A5F]'
                  }`}
                >
                  {location === l.href && (
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                  )}
                  {l.name}
                </Link>
              ))}
              <div className="px-6 py-5 bg-muted/30">
                <Link href="/login" onClick={() => {
                  setOpen(false);
                  window.scrollTo(0, 0);
                }}>
                  <Button
                    size="default"
                    className="w-full bg-gradient-to-r from-[#2FBF71] to-[#25a060] hover:from-[#25a060] hover:to-[#1f8a50] text-white font-semibold shadow-lg shadow-[#2FBF71]/25"
                    data-testid="button-mobile-login"
                  >
                    <UserRound className="w-5 h-5 mr-2" />
                    Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
