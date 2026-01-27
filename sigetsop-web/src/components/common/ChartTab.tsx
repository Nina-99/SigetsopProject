import { useState } from "react";

export type PeriodType = "monthly" | "quarterly" | "annually";

interface ChartTabProps {
  onSelectPeriod: (period: PeriodType) => void;
}

const ChartTab: React.FC<ChartTabProps> = ({ onSelectPeriod }) => {
  const [selected, setSelected] = useState<PeriodType>("monthly");

  const handleSelect = (period: PeriodType) => {
    setSelected(period);
    onSelectPeriod(period);
  };

  const getButtonClass = (option: PeriodType) =>
    selected === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        // Actualizado para usar PeriodType
        onClick={() => handleSelect("monthly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "monthly",
        )}`}
      >
        Mensual
      </button>

      <button
        // Actualizado para usar PeriodType
        onClick={() => handleSelect("quarterly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "quarterly",
        )}`}
      >
        Trimestral
      </button>

      <button
        // Actualizado para usar PeriodType
        onClick={() => handleSelect("annually")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "annually",
        )}`}
      >
        Anual
      </button>
    </div>
  );
};

export default ChartTab;
