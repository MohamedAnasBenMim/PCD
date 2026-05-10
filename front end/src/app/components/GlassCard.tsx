import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`backdrop-blur-[var(--glass-blur)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius)] professional-card-shadow ${className}`}
      style={{
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
      }}
    >
      {children}
    </div>
  );
}
