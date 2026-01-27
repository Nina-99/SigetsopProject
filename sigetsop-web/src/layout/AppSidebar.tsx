import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

// Iconos e imports existentes
import {
  BabyIcon,
  CalenderIcon,
  ChevronDownIcon,
  DocsIcon,
  FileIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
} from "../icons";
import SidebarWidget from "./SidebarWidget";
import { Logo } from "./shared";
import { useSidebar } from "../context";
import { useAuth } from "../context/AuthContext"; // Importar Auth
import { ROLE_PATHS } from "../@core";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// --- CONFIGURACIÓN DE PERMISOS POR ROL ---

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Inicio",
    path: "/",
  },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendar",
  //   path: "/calendar",
  // },
  {
    name: "Formulario AVC09",
    path: "/upload09",
    icon: <ListIcon />,
  },
  {
    icon: <BabyIcon />,
    name: "Asignaciones Familiares",
    subItems: [
      { name: "Control Prenatal", path: "/prenatal-records", pro: false },
      { name: "Natalidad y Lactancia", path: "/natal-data", pro: false },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Bajas Medicas",
    subItems: [
      { name: "Bajas", path: "/sick-leave", pro: false },
      { name: "AVC09", path: "/avc09", pro: false },
    ],
  },
  {
    icon: <FileIcon />,
    name: "File",
    path: "/filepersonnel",
  },
  {
    icon: <TableIcon />,
    name: "Tablas",
    subItems: [
      { name: "Usuarios", path: "/users", pro: false },
      { name: "Hospital", path: "/hospitals", pro: false },
      { name: "Personal", path: "/personnel", pro: false },
      { name: "Unidades", path: "/units", pro: false },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Estadisticas",
    subItems: [
      { name: "Bajas Medicas", path: "/line-chart", pro: false },
      { name: "Bajas por Unidad", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Perfil",
    path: "/profile",
  },
  {
    name: "Que es?",
    path: "/blank",
    icon: <PageIcon />,
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth(); // Obtener el usuario logueado
  const location = useLocation();

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

  //NOTE: --- LÓGICA DE FILTRADO ---
  const filteredNavItems = useMemo(() => {
    const items = navItems;
    const roleName = user?.role_data?.name || "";
    if (roleName === "Admin") return items;

    const allowedPaths = ROLE_PATHS[roleName] || [];

    return items
      .map((item) => {
        // Si el item tiene sub-elementos, filtramos los permitidos
        if (item.subItems) {
          const filteredSubs = item.subItems.filter((sub) =>
            allowedPaths.includes(sub.path),
          );
          return {
            ...item,
            subItems: filteredSubs.length > 0 ? filteredSubs : undefined,
          };
        }
        return item;
      })
      .filter((item) => {
        // Mostramos el item si su path directo es permitido O si tiene sub-elementos permitidos
        const isPathAllowed = item.path && allowedPaths.includes(item.path);
        const hasVisibleSubs = item.subItems && item.subItems.length > 0;
        return isPathAllowed || hasVisibleSubs;
      });
  }, [user]);

  const filteredOthersItems = useMemo(() => {
    const items = othersItems;
    const roleName = user?.role_data?.name || "";
    if (roleName === "Admin") return items;

    const allowedPaths = ROLE_PATHS[roleName] || [];

    return items
      .map((item) => {
        // Si el item tiene sub-elementos, filtramos los permitidos
        if (item.subItems) {
          const filteredSubs = item.subItems.filter((sub) =>
            allowedPaths.includes(sub.path),
          );
          return {
            ...item,
            subItems: filteredSubs.length > 0 ? filteredSubs : undefined,
          };
        }
        return item;
      })
      .filter((item) => {
        // Mostramos el item si su path directo es permitido O si tiene sub-elementos permitidos
        const isPathAllowed = item.path && allowedPaths.includes(item.path);
        const hasVisibleSubs = item.subItems && item.subItems.length > 0;
        return isPathAllowed || hasVisibleSubs;
      });
  }, [user]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items =
        menuType === "main" ? filteredNavItems : filteredOthersItems;
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
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev?.index === index
        ? null
        : { type: menuType, index },
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
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
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
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
                      className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                    >
                      {subItem.name}
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
      // className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-lime-800 dark:bg-lime-950 dark:border-lime-600 text-gray-500 h-screen transition-all duration-300 ease-in-out z-50 border-r border-lime-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
        <Link to="/">
          <Logo
            logoSize={40}
            showText={isExpanded || isHovered || isMobileOpen}
            fontSize="20px"
          />
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {filteredNavItems.length > 0 && (
              <div>
                <h2
                  // className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-white ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Menu"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(filteredNavItems, "main")}
              </div>
            )}
            {filteredOthersItems.length > 0 && (
              <div>
                <h2
                  // className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-100 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
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
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;
