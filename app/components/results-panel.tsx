"use client";

import { useMemo } from "react";
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography
} from "@mui/material";

import { calculateOffer, type CalculationResult } from "../lib/calculations";
import { useCatalog } from "../lib/api/use-catalog";
import { useCalculatorStore } from "../store/calculator-store";

const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT_RATE ?? "0.23");

const formatCurrency = (value: number) =>
  value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });

const formatPercent = (value: number, fractionDigits = 2) =>
  `${(value * 100).toFixed(fractionDigits)}%`;

const decodeVehicleId = (id: string) => {
  try {
    const [brand, model] = JSON.parse(id) as [string, string];
    return { brand, model };
  } catch {
    return { brand: "", model: "" };
  }
};

export function ResultsPanel() {
  const { data: catalog, isLoading, isError, error } = useCatalog();
  const form = useCalculatorStore((state) => state.form);
  const selectedServices = useCalculatorStore((state) => state.selectedServices);

  const selectedProduct = useMemo(() => {
    if (!catalog) {
      return undefined;
    }
    const products =
      form.financingType === "credit" ? catalog.creditProducts : catalog.leasingProducts;
    return products.find((product) => product.product_code === form.productCode);
  }, [catalog, form.financingType, form.productCode]);

  const vehicleInfo = useMemo(() => {
    if (form.vehicleMode === "catalog") {
      if (!form.vehicleId) {
        return { brand: "", model: "", trim: "", baseLabel: "", label: "—" };
      }
      const { brand, model } = decodeVehicleId(form.vehicleId);
      const baseLabel = [brand, model].filter(Boolean).join(" ");
      return {
        brand,
        model,
        trim: "",
        baseLabel,
        label: baseLabel || "—"
      };
    }

    const brand = form.customBrand ?? "";
    const model = form.customModel ?? "";
    const trim = form.customTrim?.trim() ?? "";
    const baseLabel = [brand, model].filter(Boolean).join(" ");
    const label = [baseLabel, trim].filter(Boolean).join(" • ").trim();

    return {
      brand,
      model,
      trim,
      baseLabel,
      label: label || "—"
    };
  }, [form.customBrand, form.customModel, form.customTrim, form.vehicleId, form.vehicleMode]);

  const activeServiceRow = useMemo(() => {
    if (!catalog || !vehicleInfo.brand || !vehicleInfo.model) {
      return undefined;
    }
    return catalog.services.find(
      (service) =>
        service.Marka === vehicleInfo.brand &&
        service.Model === vehicleInfo.model &&
        service.dlugosc_kontraktu === form.contractMonths &&
        service.przebieg_roczny === form.annualMileage
    );
  }, [catalog, form.annualMileage, form.contractMonths, vehicleInfo.brand, vehicleInfo.model]);

  const calculation = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }
    return calculateOffer({
      product: selectedProduct,
      priceGross: form.priceGross,
      termMonths: form.contractMonths,
      downPaymentPct: form.downPaymentPct,
      balloonPct: form.balloonPct,
      vatRate: VAT_RATE,
      servicesRow: activeServiceRow,
      selectedServices
    });
  }, [
    activeServiceRow,
    form.balloonPct,
    form.contractMonths,
    form.downPaymentPct,
    form.priceGross,
    selectedProduct,
    selectedServices
  ]);

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <BoxHeading />
            {isLoading && <LoadingIndicator />}
            {isError && <ErrorBanner error={error} />}
            {!isLoading && !isError && !selectedProduct && (
              <Typography variant="body2" color="text.secondary">
                Wybierz produkt finansowania, aby zobaczyć wyniki.
              </Typography>
            )}
            {!isLoading && !isError && selectedProduct && calculation && (
              <ResultSummary
                calculation={calculation}
                productName={selectedProduct.product_name}
                vehicleLabel={vehicleInfo.baseLabel || "—"}
                vehicleTrim={vehicleInfo.trim}
                contractMonths={form.contractMonths}
                annualMileage={form.annualMileage}
                clientType={form.clientType}
              />
            )}
            {!isLoading && !isError && selectedProduct && !calculation && (
              <Typography variant="body2" color="text.secondary">
                Podane parametry nie pozwalają na obliczenie raty. Sprawdź cenę pojazdu, okres i
                poziom wpłaty własnej.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {calculation && calculation.serviceBreakdown.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Szczegóły usług dodatkowych
            </Typography>
            <Stack spacing={1}>
              {calculation.serviceBreakdown.map((service) => (
                <Stack
                  key={service.key}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                  spacing={2}
                >
                  <Typography>{service.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(service.monthlyGross)} / mc
                  </Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">Razem</Typography>
                <Typography variant="subtitle2">
                  {formatCurrency(calculation.monthlyServicesGross)} / mc
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {calculation &&
        calculation.warnings.map((warning) => (
          <Alert key={warning} severity="warning" variant="outlined">
            {warning}
          </Alert>
        ))}
    </Stack>
  );
}

function BoxHeading() {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h6" component="h2">
        Wyniki kalkulacji
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Rata miesięczna uwzględnia finansowanie oraz wybrane usługi dodatkowe. Wszystkie wartości
        brutto przeliczane są również na netto (VAT {Math.round(VAT_RATE * 100)}%).
      </Typography>
    </Stack>
  );
}

function LoadingIndicator() {
  return (
    <Typography variant="body2" color="text.secondary">
      Ładuję dane katalogowe…
    </Typography>
  );
}

function ErrorBanner({ error }: { error: unknown }) {
  return (
    <Alert severity="error" variant="outlined">
      <AlertTitle>Nie udało się pobrać danych</AlertTitle>
      {error instanceof Error ? error.message : "Spróbuj ponownie za chwilę."}
    </Alert>
  );
}

type ResultSummaryProps = {
  calculation: CalculationResult;
  productName: string;
  vehicleLabel: string;
  vehicleTrim?: string;
  contractMonths: number;
  annualMileage: number;
  clientType: "business" | "consumer";
};

function ResultSummary({
  calculation,
  productName,
  vehicleLabel,
  vehicleTrim,
  contractMonths,
  annualMileage,
  clientType
}: ResultSummaryProps) {
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="subtitle1">{productName}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={`Pojazd: ${vehicleLabel}`} />
          {vehicleTrim && <Chip size="small" label={`Wersja: ${vehicleTrim}`} />}
          <Chip size="small" label={`Okres: ${contractMonths} mies.`} />
          <Chip size="small" label={`Przebieg: ${annualMileage.toLocaleString("pl-PL")} km/rok`} />
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Łączna płatność miesięczna (brutto)
        </Typography>
        <Typography variant="h3">{formatCurrency(calculation.monthlyDueGross)}</Typography>
        <Typography variant="body2" color="text.secondary">
          Finansowanie: {formatCurrency(calculation.monthlyInstallmentGross)} / mc • Usługi:{" "}
          {formatCurrency(calculation.monthlyServicesGross)} / mc
        </Typography>
        {clientType === "business" && (
          <Typography variant="body2" color="text.secondary">
            Netto (VAT {Math.round(VAT_RATE * 100)}%):{" "}
            {formatCurrency(calculation.monthlyDueNet)}
          </Typography>
        )}
      </Stack>

      <Stack spacing={1}>
        <SummaryRow
          label="Wpłata własna"
          value={formatCurrency(calculation.downPaymentAmountGross)}
        />
        <SummaryRow
          label="Kwota finansowania"
          value={formatCurrency(calculation.financedAmountGross)}
        />
        <SummaryRow
          label="Rata balonowa"
          value={formatCurrency(calculation.balloonAmountGross)}
          helper="Płatna na końcu okresu"
        />
        <SummaryRow
          label="Łączny koszt brutto"
          value={formatCurrency(calculation.totalCostGross)}
          helper={
            clientType === "business"
              ? `Netto: ${formatCurrency(calculation.totalCostNet)}`
              : undefined
          }
        />
      </Stack>

      <Divider />

      <Stack spacing={1}>
        <SummaryRow
          label="Oprocentowanie nominalne (roczne)"
          value={`${calculation.annualRate.toFixed(2)}%`}
        />
        <SummaryRow
          label="Oprocentowanie efektywne (miesięczne)"
          value={formatPercent(calculation.monthlyRate, 3)}
        />
        <SummaryRow
          label="Łączny koszt usług"
          value={formatCurrency(calculation.totalServicesGross)}
          helper={
            calculation.totalServicesGross > 0
              ? `Łącznie netto: ${formatCurrency(calculation.totalServicesNet)}`
              : undefined
          }
        />
      </Stack>
    </Stack>
  );
}

function SummaryRow({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1">{value}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Stack>
  );
}
