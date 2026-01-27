import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState, useEffect } from "react";
import { AVC09Service } from "../../services";

interface ChartData {
  units: string[];
  counts: number[];
}

export default function TopUnitsChart() {
  const [isOpen, setIsOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartData>({
    units: [],
    counts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Hook para obtener los datos del Backend
  useEffect(() => {
    setError(null);

    // 2. Llama a la función del servicio
    AVC09Service.getTopUnits()
      .then((response) => {
        setChartData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        // Manejo de errores
        setError("Error al cargar el Top 10 de unidades policiales.");
        setLoading(false);
        // Puedes loguear el error para debug
        console.error("Error fetching top units data:", err);
      });
  }, []);

  // 2. Configuración de ApexCharts (Opciones)
  const options: ApexOptions = {
    colors: ["#DC3545"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true, // HACEMOS EL GRÁFICO HORIZONTAL
        columnWidth: "80%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: true, // Habilitamos etiquetas para ver el conteo en la barra
      style: {
        colors: ["#333"], // Color de las etiquetas
      },
    },

    xaxis: {
      categories: chartData.units, // USAMOS LOS NOMBRES DE LAS UNIDADES EN EL EJE Y
      labels: {
        show: true,
        style: {
          colors: "#A0AEC0", // Color de las etiquetas
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: "Número de Bajas", // Título para el eje X
      },
    },
    yaxis: {
      reversed: true, // Para mostrar la unidad con más bajas en la parte superior
      labels: {
        show: true,
        style: {
          colors: "#A0AEC0",
          fontSize: "12px",
        },
      },
      title: {
        text: "Unidad Policial", // Título para el eje Y
      },
    },
    legend: { show: false }, // No necesitamos leyenda para una sola serie
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } }, // Ocultamos líneas horizontales para claridad
    },
    fill: { opacity: 1 },

    tooltip: {
      x: { show: true }, // Muestra el nombre de la unidad
      y: {
        formatter: (val: number) => `${val} bajas`,
      },
    },
  };

  // 3. Series de datos
  const series = [
    {
      name: "Bajas",
      data: chartData.counts, // USAMOS LOS CONTEOS DE BAJAS
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (loading) {
    return <div>Cargando Top 10 Unidades...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // 4. Renderizado del Componente
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          🏆 Top 10 Unidades con Más Bajas
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Ver Detalle
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Exportar
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-full">
          <Chart options={options} series={series} type="bar" height={350} />
        </div>
      </div>
    </div>
  );
}
