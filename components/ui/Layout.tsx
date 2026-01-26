
import React from 'react';

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

export const Heading = ({ children, level = 1, className = "" }: { children: React.ReactNode, level?: 1|2|3, className?: string }) => {
  const styles = {
    1: "text-3xl font-extrabold text-slate-900 tracking-tight",
    2: "text-xl font-bold text-slate-800",
    3: "text-sm font-semibold uppercase tracking-wider text-[#4c63d9]"
  };
  const Tag = `h${level}` as any;
  return <Tag className={`${styles[level]} ${className}`}>{children}</Tag>;
};

export const Text = ({ children, variant = "body", className = "" }: { children: React.ReactNode, variant?: "body"|"small"|"muted", className?: string }) => {
  const styles = {
    body: "text-slate-600 leading-relaxed",
    small: "text-sm text-slate-500",
    muted: "text-xs text-slate-400 font-medium"
  };
  return <p className={`${styles[variant]} ${className}`}>{children}</p>;
};

export const Button = ({ children, onClick, disabled, variant = "primary", className = "" }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, variant?: "primary"|"secondary", className?: string }) => {
  const base = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm";
  const variants = {
    primary: "bg-[#4c63d9] text-white hover:bg-[#3b4fb5]",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const Section = ({ title, children, className = "" }: { title?: string, children: React.ReactNode, className?: string }) => (
  <section className={`space-y-4 ${className}`}>
    {title && <Heading level={3}>{title}</Heading>}
    {children}
  </section>
);
