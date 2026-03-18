import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  const base = "bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600";
  return <th className={className ? `${base} ${className}` : base}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  const base = "px-3 py-2 text-sm text-gray-800 border-t border-gray-100";
  return <td className={className ? `${base} ${className}` : base}>{children}</td>;
}

