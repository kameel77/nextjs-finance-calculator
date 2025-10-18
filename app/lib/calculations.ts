import type { FinancingProduct, Service } from "./schemas";

export type ClientType = "business" | "consumer";
export type FinancingType = "credit" | "leasing";

export type SelectedServices = {
  insurance: boolean;
  tyre: boolean;
  service: boolean;
  assistance: boolean;
};

export type ServiceBreakdown = {
  key: keyof SelectedServices;
  label: string;
  monthlyGross: number;
};

export type CalculationInput = {
  product: FinancingProduct;
  priceGross: number;
  termMonths: number;
  downPaymentPct: number;
  balloonPct: number;
  vatRate: number;
  servicesRow?: Service;
  selectedServices: SelectedServices;
};

export type CalculationResult = {
  financedAmountGross: number;
  downPaymentAmountGross: number;
  balloonAmountGross: number;
  monthlyRate: number;
  annualRate: number;
  monthlyInstallmentGross: number;
  monthlyInstallmentNet: number;
  totalInstallmentsGross: number;
  monthlyServicesGross: number;
  monthlyServicesNet: number;
  monthlyDueGross: number;
  monthlyDueNet: number;
  totalServicesGross: number;
  totalServicesNet: number;
  totalCostGross: number;
  totalCostNet: number;
  serviceBreakdown: ServiceBreakdown[];
  warnings: string[];
};

const SERVICE_MAPPING: Array<{
  key: keyof SelectedServices;
  label: string;
  field: keyof Service;
}> = [
  { key: "insurance", label: "Ubezpieczenie", field: "Insurance_Rate" },
  { key: "tyre", label: "Opony", field: "Tyre_Rate" },
  { key: "service", label: "Serwis", field: "Service_Rate" },
  { key: "assistance", label: "Samochód zastępczy 14 dni", field: "SZ_14D" }
];

const toDecimal = (value: number) => Number.isFinite(value) ? value : 0;

const clampPercentage = (value: number) =>
  Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;

export const calculateOffer = (input: CalculationInput): CalculationResult | null => {
  const {
    product,
    priceGross,
    termMonths,
    downPaymentPct,
    balloonPct,
    vatRate,
    servicesRow,
    selectedServices
  } = input;

  if (!product || priceGross <= 0 || termMonths <= 0) {
    return null;
  }

  const warnings: string[] = [];
  const vatMultiplier = 1 + Math.max(vatRate, 0);

  const sanitizedDownPaymentPct = clampPercentage(downPaymentPct);
  const sanitizedBalloonPct = clampPercentage(balloonPct);

  const downPaymentAmount = priceGross * (sanitizedDownPaymentPct / 100);
  const balloonAmount = priceGross * (sanitizedBalloonPct / 100);

  const financedAmount = Math.max(priceGross - downPaymentAmount, 0);

  if (financedAmount <= 0) {
    warnings.push("Kwota finansowania jest równa 0 – sprawdź cenę oraz wysokość wpłaty.");
    return null;
  }

  const annualRate =
    toDecimal(product.WIBOR_Roczny) +
    toDecimal(product.base_margin_pct) +
    toDecimal(product.spread_pct) +
    toDecimal(product.marga_dodatkowa);

  const monthlyRate = annualRate / 12 / 100;
  const principal = financedAmount;
  const fv = balloonAmount;

  let monthlyInstallment = 0;

  if (monthlyRate === 0) {
    monthlyInstallment = (principal - fv) / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyInstallment =
      (principal - fv / factor) * (monthlyRate / (1 - 1 / factor));
  }

  if (!Number.isFinite(monthlyInstallment) || monthlyInstallment < 0) {
    warnings.push("Nie udało się wyliczyć raty miesięcznej – sprawdź parametry kalkulacji.");
    return null;
  }

  const serviceBreakdown: ServiceBreakdown[] = [];
  let monthlyServices = 0;

  if (servicesRow) {
    for (const mapping of SERVICE_MAPPING) {
      if (!selectedServices[mapping.key]) {
        continue;
      }
      const rawValue = Number(servicesRow[mapping.field]);
      const monthlyGross = Number.isFinite(rawValue) ? rawValue : 0;
      monthlyServices += monthlyGross;
      serviceBreakdown.push({
        key: mapping.key,
        label: mapping.label,
        monthlyGross
      });
    }
  } else if (Object.values(selectedServices).some(Boolean)) {
    warnings.push("Brak zdefiniowanych stawek usług dla wybranej konfiguracji.");
  }

  const totalInstallments = monthlyInstallment * termMonths;
  const totalServices = monthlyServices * termMonths;
  const totalCost = downPaymentAmount + totalInstallments + totalServices + balloonAmount;

  const toNet = (value: number) => value / vatMultiplier;

  return {
    financedAmountGross: principal,
    downPaymentAmountGross: downPaymentAmount,
    balloonAmountGross: balloonAmount,
    monthlyRate,
    annualRate,
    monthlyInstallmentGross: monthlyInstallment,
    monthlyInstallmentNet: toNet(monthlyInstallment),
    totalInstallmentsGross: totalInstallments,
    monthlyServicesGross: monthlyServices,
    monthlyServicesNet: toNet(monthlyServices),
    monthlyDueGross: monthlyInstallment + monthlyServices,
    monthlyDueNet: toNet(monthlyInstallment + monthlyServices),
    totalServicesGross: totalServices,
    totalServicesNet: toNet(totalServices),
    totalCostGross: totalCost,
    totalCostNet: toNet(totalCost),
    serviceBreakdown,
    warnings
  };
};
