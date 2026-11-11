import React, { useEffect, useRef, useState } from "react";

interface AnimatedRevealProps {
  children: React.ReactNode;
  delay?: number; // delay in ms
  initialAnimate?: boolean; // trigger immediately on mount if true
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedReveal: React.FC<AnimatedRevealProps> = ({
  children,
  delay = 0,
  initialAnimate = false,
  className = "",
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialAnimate) {
      const timer = setTimeout(() => setIsVisible(true), Math.max(delay, 40));
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [delay, initialAnimate]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(-50px)",
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};
