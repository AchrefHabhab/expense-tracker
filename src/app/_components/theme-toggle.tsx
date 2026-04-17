'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      whileTap={{ scale: 0.92 }}
      className="relative flex h-9 w-[4.5rem] items-center rounded-full p-1.5 shadow-inner transition-[background] duration-700 ease-in-out"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0c1445 0%, #1a1040 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #7dd3fc 0%, #bae6fd 40%, #fef3c7 100%)',
      }}
      suppressHydrationWarning
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.span
            key="stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0"
          >
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute left-2.5 top-1.5 size-[3px] rounded-full bg-white"
            />
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.3 }}
              className="absolute left-4 top-3 size-[2px] rounded-full bg-white/80"
            />
            <motion.span
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.8 }}
              className="absolute left-3 bottom-2 size-[4px] rounded-full bg-white/70"
            />
            <motion.span
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 1.2 }}
              className="absolute left-[1.1rem] top-1.5 size-[2px] rounded-full bg-white/60"
            />
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
              className="absolute left-2 top-[45%] size-[2px] rounded-full bg-yellow-200/80"
            />
          </motion.span>
        ) : mounted ? (
          <motion.span
            key="clouds"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0"
          >
            <motion.span
              animate={{ x: [0, 2, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute right-3 top-1.5 flex gap-px"
            >
              <span className="size-2 rounded-full bg-white/70" />
              <span className="-ml-1 mt-0.5 size-1.5 rounded-full bg-white/50" />
            </motion.span>
            <motion.span
              animate={{ x: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-1.5 right-2.5 flex gap-px"
            >
              <span className="size-1.5 rounded-full bg-white/50" />
              <span className="-ml-0.5 size-1 rounded-full bg-white/30" />
            </motion.span>
          </motion.span>
        ) : null}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 100, damping: 18, mass: 1.2 }}
        className="relative z-10 flex size-6 items-center justify-center rounded-full shadow-lg"
        style={{
          marginLeft: isDark ? 'auto' : '0px',
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #334155, #1e293b)'
            : 'radial-gradient(circle at 40% 30%, #fff7ed, #fef3c7, #fde68a)',
          boxShadow: isDark
            ? '0 2px 10px rgba(100,120,200,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 12px rgba(251,191,36,0.4), 0 0 20px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -120, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 120, scale: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="text-sm leading-none"
            >
              🌙
            </motion.span>
          ) : mounted ? (
            <motion.span
              key="sun"
              initial={{ rotate: 120, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -120, scale: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="text-sm leading-none"
            >
              ☀️
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
