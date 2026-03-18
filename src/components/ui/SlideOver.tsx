import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export function SlideOver({
  open,
  title,
  children,
  onClose,
  closeOnOverlayClick = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
}) {
  if (!open) return null;

  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-label="Overlay"
      />

      <div
        className={[
          "absolute right-3 top-3 bottom-3 w-[90vw] bg-white shadow-2xl border border-gray-200 rounded-3xl overflow-hidden",
          "transform-gpu transition-transform duration-300 ease-out",
          entered ? "translate-x-0" : "translate-x-[110%]",
        ].join(" ")}
      >
        <div className="h-[56px] px-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        <div className="h-[calc(100%-56px)] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

