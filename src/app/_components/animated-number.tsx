'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useInView } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatFn?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, formatFn, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 20 });
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = formatFn
          ? formatFn(latest)
          : latest.toFixed(2);
      }
    });

    return unsubscribe;
  }, [springValue, formatFn]);

  return <span ref={ref} className={className} />;
}
