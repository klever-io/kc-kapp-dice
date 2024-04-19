import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

type Props = {
  value: number;
  loading: boolean;
};

export default function Counter({ value, loading }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        const newValue = motionValue.get() >= 100 ? 0 : motionValue.get() + 1;
        motionValue.set(newValue);
        // If the value reaches 100, reset it to 0 and start over
        if (newValue === 100) {
          setTimeout(() => {
            motionValue.set(0);
          }, 10); // Adjust the delay before resetting to 0 if needed
        }
      }, 20); // Adjust the interval as needed
      return () => clearInterval(interval);
    }
  }, [loading, motionValue]);

  useEffect(() => {
    if (!loading && isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value, loading]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (latest <= 0) return;
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(
          latest.toFixed(0)
        );
      }
    });
  }, [springValue]);

  return (
    <span ref={ref}>{loading ? motionValue.get().toFixed(0) : value}</span>
  );
}
