import { useEffect, useRef, useState } from "react";

import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
//import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import Button from "../components/ui/button/Button";


const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
   <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-black dark:border-gray-800">

  <div className="flex items-center justify-between px-4 lg:px-6 h-16">

    {/* 🔹 IZQUIERDA */}
    <div className="flex items-center gap-3">

      {/* Toggle Sidebar */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
        aria-label="Toggle Sidebar"
      >
        ☰
      </button>

      {/* Logo 
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center"
      >
        <img
          className="h-9 w-auto dark:hidden"
          src="/images/logo/logo50A-white.svg"
          alt="Logo"
        />
        <img
          className="h-9 w-auto hidden dark:block"
          src="/images/logo/logo50A-dark.svg"
          alt="Logo"
        />
      </button>*/}
    </div>

    {/* CENTRO (BANNER FLEXIBLE) */}
    <div className="hidden md:flex flex-1 justify-center px-6">
      <div className="bg-[var(--color-yellow-cod)]  text-black text-sm font-semibold px-8 py-2  rounded-full shadow-sm whitespace-nowrap">
        MARCANDO EL CAMINO JUNTOS. Este 2026, tus compras valen más.
      </div>
    </div>

    {/* 🔹 DERECHA */}
    <div className="flex items-center gap-3">

      <UserDropdown />

      <ThemeToggleButton />

      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition"
        aria-label="Ayuda"
      >
        ?
      </button>

    </div>

  </div>
</header>
  );
};

export default AppHeader;
