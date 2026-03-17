import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">{children}</th>;
}

export function Td({ children }: { children?: ReactNode }) {
  return <td className="px-3 py-2 text-sm text-gray-800 border-t border-gray-100">{children}</td>;
}

