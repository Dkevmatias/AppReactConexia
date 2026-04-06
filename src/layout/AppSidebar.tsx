import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { VscCommentDiscussionSparkle } from "react-icons/vsc";
import AppLogo from "../components/logo/AppLogo";

import {
  //BoxCubeIcon,
  //CalenderIcon,

  Inicio,
  TerminosIcon,
  PromocionesIcon,
  ChevronDownIcon,
  CanjearHicon,
  HorizontaLDots,
  //ListIcon,
  //PageIcon,
  //PieChartIcon,
  //PlugInIcon,
  //TableIcon,
  //UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
//import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/useAuth";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    icon: React.ReactNode;
    pro?: boolean;
    new?: boolean;
  }[];
};

// === MENÚ PRINCIPAL ===
const navItems: NavItem[] = [
  {
    icon: <Inicio />,
    name: "Inicio",
    path: "/dashboard/home",
    /*
    subItems: [
      // {name: "Inicio", path: "/dashboard/home", icon:<HiOutlineShoppingCart />, pro: false },
       {name: "Canjear", path: "/dashboard/evento",icon:<HiOutlineShoppingCart />, pro: false },
      // {name: "Historial", path: "/dashboard/historial", pro: false },
      // {name: "Términos y Condiciones", path: "/dashboard/terminos", pro: false },
      // {name: "Aviso de Privacidad", path: "/dashboard/aviso", pro: false },
      //{name: "Mis Boletos", path: "/dashboard/boletos", pro: false },
     
    //  {name: "Acumulado", path: "/clientes/acumulado", pro: false },
      //  {name: "Sorteo", path: "/sorteo", pro: false },
     // {name: "Reportes BI", path: "/dashboard/reportes", pro: false },
    ],*/
    //Configuración de Menu
  },
  {
    icon: <CanjearHicon />,
    name: "Canjear",
    path: "/dashboard/evento",
  },
  {
    icon: <TerminosIcon />,
    name: "Terminos y Condiciones",
    path: "/dashboard/terminos",
  },
  {
    icon: <PromocionesIcon />,
    name: "Promociones",
    path: "/dashboard/promociones",
  },
  {
    icon: <PromocionesIcon />,
    name: "Reportes BI",
    path: "/dashboard/reportes",
  },
  {
    icon: <VscCommentDiscussionSparkle />,
    name: "Respuesta Clientes",
    path: "/ConfigPage/Respuesta",
  },
  /*
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    subItems: [
      { name: "Blank Page", path: "/blank", pro: false },
      { name: "404 Error", path: "/error-404", pro: false },
    ],
  },

}*/
];

// === OTROS MENÚS ===
const othersItems: NavItem[] = [
  /*{

    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },*/
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  //console.log("User Role in Sidebar:", user);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // === FILTRO DE MENÚ SEGÚN ROL ===
  const allowedForRol3 = [
    "Inicio",
    "Canjear",
    "Terminos y Condiciones",
    "Promociones",
  ];

  const filteredNavItems = navItems.filter((item) => {
    switch (user?.role) {
      case 1: // Administrador
        return true;
      case 2: //Vendedor
        return item.name !== "Pages";
      case 3: // Cliente
        return allowedForRol3.includes(item.name);
      default:
        return false;
    }
  });

  const filteredOthersItems = othersItems.filter((item) => {
    switch (user?.role) {
      case 1: // Admin ve todo
        return true;
      case 2: // Vendedor
        return item.name === "Charts";
      case 3: // Clientes Evento y Boletos
        return ["Dashboard"].includes(item.name);
      default:
        return false;
    }
  });

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-6">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {/*Anteriormente no tenía Icono {subItem.name}*/}
                      <div className="flex items-center gap-2">
                        {subItem.icon}
                        <span>{subItem.name}</span>
                      </div>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-black dark:border-neutral-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center justify-center w-full">
          {isExpanded || isHovered || isMobileOpen ? (
            <AppLogo size="h-30" />
          ) : (
            <AppLogo size="h-22" />
          )}
        </Link>
      </div>

      <div className="flex flex-col  h-full overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
            {filteredOthersItems.length > 0 && (
              <div className="">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(filteredOthersItems, "others")}
              </div>
            )}
          </div>
        </nav>
        <div
          className={`mt-auto pb-6 flex flex-col items-center text-center px-4
    ${isExpanded || isHovered || isMobileOpen ? "flex" : "hidden"}  // si isOpen false → oculto`}
        >
          {/* Imagen modo claro */}
          <img
            src="/images/page/footerSB-white.png"
            className="block dark:hidden max-w-[150px] mb-3"
          />

          {/* Imagen modo oscuro */}
          <img
            src="/images/page/footerSBar-dark.png"
            className="hidden dark:block max-w-[150px] mb-3"
          />
          {/* Texto */}
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            © 2026 CODIALUB - Programa de Recompensas.
            <br />
            Todos los derechos reservados.
          </p>
        </div>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
