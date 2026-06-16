import type { RiskFactors } from "@workspace/api-client-react";

interface FactorBreakdownProps {
  factors: RiskFactors;
}

const FACTOR_ROWS: Array<{
  key: keyof RiskFactors;
  label: string;
  max: number;
  description: string;
  colorClass: string;
}> = [
  {
    key: "dpc",
    label: "DPC",
    max: 4,
    description: "Data Processing Context: sensitivity of the exposed data",
    colorClass: "bg-red-500",
  },
  {
    key: "ei",
    label: "EI",
    max: 1,
    description: "Ease of Identification: how directly the data identifies you",
    colorClass: "bg-orange-500",
  },
  {
    key: "cb",
    label: "CB",
    max: 1,
    description: "Circumstances of Breach: public exposure or malicious compromise",
    colorClass: "bg-yellow-500",
  },
  {
    key: "enisaSeverity",
    label: "ENISA SE",
    max: 4,
    description: "Raw ENISA severity: (DPC x EI) + CB",
    colorClass: "bg-blue-500",
  },
  {
    key: "normalizedScore",
    label: "Normalized score",
    max: 100,
    description: "User-facing score normalized from ENISA SE to 0-100",
    colorClass: "bg-emerald-500",
  },
];

export function FactorBreakdown({ factors }: FactorBreakdownProps) {
  return (
    <div className="space-y-3" data-testid="factor-breakdown">
      {FACTOR_ROWS.map((row) => {
        const rawValue = Number(factors[row.key] ?? 0);
        const value = Math.max(0, Math.min(rawValue, row.max));
        const pct = (value / row.max) * 100;
        return (
          <div key={row.key} data-testid={`factor-${row.key}`}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {Number.isInteger(value) ? value : value.toFixed(2)}
                <span className="opacity-60"> / {row.max}</span>
              </span>
            </div>
            <div
              className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={row.max}
              aria-label={row.label}
            >
              <div
                className={`h-full ${row.colorClass} transition-all duration-700 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{row.description}</p>
          </div>
        );
      })}
    </div>
  );
}
