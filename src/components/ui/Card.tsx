import { ReactNode } from "react";

interface CardProps {
  title?: string;
  value?: string | number;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function Card({
  title,
  value,
  icon,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 ${className}`}
    >
      {(title || value || icon) && (
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <p className="text-sm font-medium text-gray-500">{title}</p>
            )}
            {value !== undefined && (
              <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 rounded-lg bg-emerald-50 p-3 text-emerald-500">
              {icon}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
