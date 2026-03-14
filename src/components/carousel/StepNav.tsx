import type { StepNumber } from "@/types/carousel";

const STEPS = [
  { num: 1 as StepNumber, label: "Notion" },
  { num: 2 as StepNumber, label: "Contenido" },
  { num: 3 as StepNumber, label: "Revisar" },
  { num: 4 as StepNumber, label: "Canva" },
];

interface StepNavProps {
  current: StepNumber;
  onGo: (step: StepNumber) => void;
}

const StepNav = ({ current, onGo }: StepNavProps) => (
  <nav className="flex gap-1 mb-6 surface-1 border border-border rounded-lg p-1">
    {STEPS.map(({ num, label }) => {
      const isActive = num === current;
      const isDone = num < current;
      return (
        <button
          key={num}
          onClick={() => onGo(num)}
          className={`flex-1 py-2.5 px-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all duration-150 border ${
            isActive
              ? "surface-3 text-foreground border-border-strong"
              : isDone
              ? "text-success bg-transparent border-transparent"
              : "text-muted-foreground bg-transparent border-transparent"
          } cursor-pointer`}
        >
          <span
            className={`w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9px] shrink-0 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : isDone
                ? "bg-success text-success-foreground"
                : "bg-border"
            }`}
          >
            {isDone ? "✓" : num}
          </span>
          {label}
        </button>
      );
    })}
  </nav>
);

export default StepNav;
