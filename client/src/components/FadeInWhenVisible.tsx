import { useRef, useEffect, type ReactNode } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface FadeInWhenVisibleProps {
  children: ReactNode;
  delay?: number;
}

export default function FadeInWhenVisible({ children, delay = 0 }: FadeInWhenVisibleProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate={controls}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
}
