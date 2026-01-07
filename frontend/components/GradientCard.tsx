"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface GradientCardProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
  variant?: "gradient-card-effect" | "only-border-card-effect";
}

export function GradientCard({
  children,
  className,
  variant = "gradient-card-effect",
  ...props
}: GradientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const card = cardRef.current;
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  // Extract className parts
  const { style: propsStyle, ...restProps } = props;

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl p-[1px] transition-all duration-300 overflow-hidden group"
      style={propsStyle}
      {...restProps}
    >
      {/* Gradient border - shows on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none",
          isHovered && "opacity-100"
        )}
        style={{
          background: `conic-gradient(from 0deg at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(59, 130, 246, 0.8) 0deg,
            rgba(147, 51, 234, 0.8) 90deg,
            rgba(236, 72, 153, 0.8) 180deg,
            rgba(59, 130, 246, 0.8) 270deg,
            rgba(59, 130, 246, 0.8) 360deg)`,
        }}
      />

      {/* Inner card with background and content - creates border effect */}
      <div className={cn(
        "relative rounded-2xl h-full w-full p-8",
        className
      )}>
        {/* Background gradient effect - only for gradient-card-effect variant */}
        {variant === "gradient-card-effect" && (
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                rgba(147, 51, 234, 0.15) 0%, 
                rgba(59, 130, 246, 0.1) 40%, 
                transparent 70%)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
