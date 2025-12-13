
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";


export default function AppLayout() {


  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}

function LayoutContent() {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();


  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      {/*  Sidebar + fondo móvil */}
      <AppSidebar />
      <Backdrop />

      {/*Contenedor principal */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <main className="p-4 mx-auto max-w-screen-2xl md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

