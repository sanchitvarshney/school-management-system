import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  /** Sticks to bottom of modal; main content scrolls above */
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;
  const hasFooter = footer != null && footer !== false;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={`relative flex w-full max-h-[min(90vh,900px)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 max-w-xl ${className || ""}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {hasFooter ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
            <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-white px-4 py-3">
              {footer}
            </div>
          </>
        ) : (
          <div className="max-h-[min(calc(90vh-73px),820px)] overflow-y-auto p-4">{children}</div>
        )}
      </div>
    </div>
  );
}

