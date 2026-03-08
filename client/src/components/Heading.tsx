import { motion, useReducedMotion } from 'framer-motion';

interface HeadingProps {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
  center?: boolean;
}

export default function Heading({ 
  children, 
  gradient = 'from-blue-500 to-indigo-500', 
  className = '', 
  center = false 
}: HeadingProps) {
  const shouldReduceMotion = useReducedMotion();

  const base = `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`;
  const align = center ? 'text-center' : '';

  const entrance = shouldReduceMotion
    ? undefined
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  const whileHover = shouldReduceMotion ? undefined : { scale: 1.05 };

  const hoverClasses = shouldReduceMotion
    ? ''
    : 'transition transform duration-200 ease-out hover:tracking-wide filter hover:brightness-110 hover:drop-shadow-xl cursor-default';

  return (
    <motion.h2
      {...(entrance ?? {})}
      whileHover={whileHover}
      className={`${base} ${className} ${align} ${hoverClasses}`.trim()}
    >
      {children}
    </motion.h2>
  );
}
