import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab, { PeriodType } from "../common/ChartTab";
import { AVC09Service } from "../../services";



const aggregateToQuarterly = (monthlyData: number[]): number[] => {
  // Trimestre 1: Ene, Feb, Mar (índices 0, 1, 2)
  const Q1 = monthlyData[0] + monthlyData[1] + monthlyData[2];
  // Trimestre 2: Abr, May, Jun (índices 3, 4, 5)
  const Q2 = monthlyData[3] + monthlyData[4] + monthlyData[5];
  // Trimestre 3: Jul, Ago, Sep (índices 6, 7, 8)
  const Q3 = monthlyData[6] + monthlyData[7] + monthlyData[8];
  // Trimestre 4: Oct, Nov, Dic (índices 9, 10, 11)
  const Q4 = monthlyData[9] + monthlyData[10] + monthlyData[11];

  return [Q1, Q2, Q3, Q4];
};

// Función para agregar datos mensuales a anuales
const aggregateToAnnually = (monthlyData: number[]): number[] => {
  const annualTotal = monthlyData.reduce((sum, count) => sum + count, 0);
  return [annualTotal];
};

export default function StatisticsChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("monthly");
  const currentYear = new Date().getFullYear();
  
  // Estados para dos años seleccionables
  const [year1, setYear1] = useState<number>(currentYear);      // Año principal (actual)
  const [year2, setYear2] = useState<number>(currentYear - 1);  // Año a comparar (pasado)
  
  // Datos para comparación
  const [year1Data, setYear1Data] = useState<number[]>([]);
  const [year2Data, setYear2Data] = useState<number[]>([]);
  
  // Generar todos los años disponibles (últimos 10 años)
  const availableYears = Array.from(
    { length: 10 }, 
    (_, i) => currentYear - i  // [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016]
  );

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos de ambos años
        const [res1, res2] = await Promise.all([
          AVC09Service.getStatics(year1),
          AVC09Service.getStatics(year2),
        ]);
        
        setYear1Data(res1.data.extended_leaves_monthly_count);
        setYear2Data(res2.data.extended_leaves_monthly_count);
        
      } catch (e) {
        if (axios.isAxiosError(e)) {
          const errorMessage = e.response
            ? `Error ${e.response.status}: ${e.response.statusText}`
            : e.message;
          setError(`Error al obtener datos: ${errorMessage}`);
        } else {
          setError("Ocurrió un error desconocido.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si ambos años son válidos
    if (year1 && year2) {
      fetchComparisonData();
    }
  }, [year1, year2]);  // Recargar cuando cambie cualquier año

  // NOTE: useMemo para recalcular los datos del gráfico SÓLO si cambian los datos o selectedPeriod
  const { chartData, chartCategories, chartTitleSuffix } = useMemo(() => {
    const processData = (data: number[]) => {
      switch (selectedPeriod) {
        case "monthly":
          return data;
        case "quarterly":
          return aggregateToQuarterly(data);
        case "annually":
          return aggregateToAnnually(data);
        default:
          return data;
      }
    };

    let categories: string[] = [];
    let titleSuffix = "";

    switch (selectedPeriod) {
      case "monthly":
        categories = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        titleSuffix = `Meses`;
        break;
      case "quarterly":
        categories = ["T1", "T2", "T3", "T4"];
        titleSuffix = `Trimestres`;
        break;
      case "annually":
        categories = ["Total"];
        titleSuffix = `Anual`;
        break;
    }

    return {
      chartData: {
        year1: processData(year1Data),
        year2: processData(year2Data),
      },
      chartCategories: categories,
      chartTitleSuffix: titleSuffix,
    };
  }, [year1Data, year2Data, selectedPeriod]);

  const series = [
    {
      name: `Año ${year1}`,
      data: chartData.year1,
    },
    {
      name: `Año ${year2}`,
      data: chartData.year2,
    },
  ];

  // 3. Opciones de ApexCharts (se actualiza el eje X)
  const options: ApexOptions = useMemo(() => ({
    legend: { 
      show: true, 
      position: "top", 
      horizontalAlign: "center",
      offsetY: 0,
      labels: {
        colors: ["#6B7280"],
        useSeriesColors: false,
      },
    },
    colors: ["#84cc16", "#ef4444"], // lime-500 para año 1, red-500 para año 2
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    stroke: { curve: "straight", width: [2, 2] },
    fill: { 
      type: "gradient", 
      gradient: { 
        opacityFrom: 0.55, 
        opacityTo: 0 
      } 
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      x: { formatter: (val) => val.toString() },
      y: { formatter: (val) => `${val} bajas` },
      theme: "light",
    },
    xaxis: {
      type: "category",
      categories: chartCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
      },
      title: { text: "N° Bajas", style: { fontSize: "12px" } },
    },
  }), [chartCategories]);

  // 4. Renderizado condicional
  if (loading) return <p>Cargando estadísticas...</p>;
  if (error)
    return (
      <p className="text-red-600">Error al cargar estadísticas: {error}</p>
    );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Comparación de Bajas Extendidas
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Comparación por **{chartTitleSuffix}**: Año {year1} vs Año {year2}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:justify-end">
          {/* Selectores de años */}
          <div className="flex items-center gap-2">
            <select
              value={year1}
              onChange={(e) => setYear1(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm 
                         bg-white dark:bg-gray-800 dark:border-gray-600 
                         dark:text-gray-200 focus:outline-none focus:ring-2 
                         focus:ring-lime-500 focus:border-transparent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-gray-500 dark:text-gray-400 text-sm">vs</span>
            <select
              value={year2}
              onChange={(e) => setYear2(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm 
                         bg-white dark:bg-gray-800 dark:border-gray-600 
                         dark:text-gray-200 focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-transparent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {/* Se pasa la función para actualizar el estado */}
          <ChartTab onSelectPeriod={setSelectedPeriod} />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
