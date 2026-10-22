import type { ReactNode } from "react";

type TablaScrollProps = {
  children: ReactNode;
  className?: string;
};

/** Contenedor para tablas anchas: permite pan horizontal en celular. */
export default function TablaScroll({
  children,
  className = "",
}: TablaScrollProps) {
  return (
    <div
      className={`min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] ${className}`}
    >
      {children}
    </div>
  );
}
