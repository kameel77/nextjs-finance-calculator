"use client";

import { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";

import type { ClientType, FinancingType, SelectedServices } from "../lib/calculations";
import { useCatalog } from "../lib/api/use-catalog";
import type { FinancingProduct } from "../lib/schemas";
import { useCalculatorStore } from "../store/calculator-store";

const DEFAULT_ANNUAL_MILEAGES = [15000, 20000, 25000, 30000, 35000, 40000];

const SERVICE_OPTIONS: Array<{
  key: keyof SelectedServices;
  label: string;
  field: "Insurance_Rate" | "Tyre_Rate" | "Service_Rate" | "SZ_14D";
}> = [
  { key: "insurance", label: "Ubezpieczenie", field: "Insurance_Rate" },
  { key: "tyre", label: "Opony", field: "Tyre_Rate" },
  { key: "service", label: "Serwis mechaniczny", field: "Service_Rate" },
  { key: "assistance", label: "Samochód zastępczy 14 dni", field: "SZ_14D" }
];

const encodeVehicleId = (brand: string, model: string) => JSON.stringify([brand, model]);

const decodeVehicleId = (id: string) => {
  try {
    const [brand, model] = JSON.parse(id) as [string, string];
    return { brand, model };
  } catch {
    return { brand: "", model: "" };
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ParameterForm() {
  const {
    data: catalog,
    isLoading,
    isError,
    error
  } = useCatalog();

  const form = useCalculatorStore((state) => state.form);
  const selectedServices = useCalculatorStore((state) => state.selectedServices);
  const setField = useCalculatorStore((state) => state.setField);
  const setFields = useCalculatorStore((state) => state.setFields);
  const setSelectedServices = useCalculatorStore((state) => state.setSelectedServices);
  const resetSelectedServices = useCalculatorStore((state) => state.resetSelectedServices);

  const activeProducts = useMemo(() => {
    if (!catalog) {
      return [] as FinancingProduct[];
    }
    return form.financingType === "credit" ? catalog.creditProducts : catalog.leasingProducts;
  }, [catalog, form.financingType]);

  const selectedProduct = useMemo(
    () => activeProducts.find((product) => product.product_code === form.productCode),
    [activeProducts, form.productCode]
  );

  const vehicleOptions = useMemo(() => {
    if (!catalog) {
      return [];
    }
    return catalog.vehicles.map((vehicle) => ({
      id: encodeVehicleId(vehicle.Marka, vehicle.Model),
      label: `${vehicle.Marka} ${vehicle.Model}`
    }));
  }, [catalog]);

  useEffect(() => {
    if (!catalog || !vehicleOptions.length) {
      return;
    }

    const exists = vehicleOptions.some((option) => option.id === form.vehicleId);

    if (!exists) {
      setField("vehicleId", vehicleOptions[0].id);
      resetSelectedServices();
    }
  }, [catalog, form.vehicleId, resetSelectedServices, setField, vehicleOptions]);

  useEffect(() => {
    if (!catalog || !activeProducts.length) {
      return;
    }

    const exists = activeProducts.some((product) => product.product_code === form.productCode);

    if (!exists) {
      const [firstProduct] = activeProducts;
      if (firstProduct) {
        setFields({
          productCode: firstProduct.product_code,
          downPaymentPct: firstProduct.min_downpayment_pct,
          balloonPct: clamp(form.balloonPct, 0, firstProduct.max_balloon_pct)
        });
      }
      return;
    }

    if (!selectedProduct) {
      return;
    }

    const nextValues: Partial<typeof form> = {};
    let shouldUpdate = false;

    if (form.downPaymentPct < selectedProduct.min_downpayment_pct) {
      nextValues.downPaymentPct = selectedProduct.min_downpayment_pct;
      shouldUpdate = true;
    }

    if (form.balloonPct > selectedProduct.max_balloon_pct) {
      nextValues.balloonPct = selectedProduct.max_balloon_pct;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setFields(nextValues);
    }
  }, [
    activeProducts,
    catalog,
    form.balloonPct,
    form.downPaymentPct,
    form.productCode,
    selectedProduct,
    setFields
  ]);

  const availableTerms = useMemo(() => {
    if (!catalog) {
      return [] as number[];
    }

    const terms = new Set<number>();

    if (selectedProduct) {
      const steps = Math.max(Math.floor(selectedProduct.max_term / 12), 1);
      for (let i = 1; i <= steps; i += 1) {
        terms.add(i * 12);
      }
    }

    if (form.vehicleId) {
      const { brand, model } = decodeVehicleId(form.vehicleId);
      catalog.services.forEach((service) => {
        if (service.Marka === brand && service.Model === model) {
          terms.add(service.dlugosc_kontraktu);
        }
      });
    }

    const result = Array.from(terms).filter((term) => term > 0);

    if (!result.length) {
      return [12, 24, 36, 48, 60];
    }

    return result.sort((a, b) => a - b);
  }, [catalog, form.vehicleId, selectedProduct]);

  useEffect(() => {
    if (!availableTerms.length) {
      return;
    }

    if (!availableTerms.includes(form.contractMonths)) {
      setField("contractMonths", availableTerms[0]);
      resetSelectedServices();
    }
  }, [availableTerms, form.contractMonths, resetSelectedServices, setField]);

  const mileageOptions = useMemo(() => {
    if (!catalog || !form.vehicleId) {
      return DEFAULT_ANNUAL_MILEAGES;
    }

    const { brand, model } = decodeVehicleId(form.vehicleId);
    const matches = catalog.services.filter(
      (service) =>
        service.Marka === brand &&
        service.Model === model &&
        service.dlugosc_kontraktu === form.contractMonths
    );

    if (!matches.length) {
      return DEFAULT_ANNUAL_MILEAGES;
    }

    const uniqueValues = Array.from(new Set(matches.map((service) => service.przebieg_roczny)));
    return uniqueValues.sort((a, b) => a - b);
  }, [catalog, form.contractMonths, form.vehicleId]);

  useEffect(() => {
    if (!mileageOptions.length) {
      return;
    }

    if (!mileageOptions.includes(form.annualMileage)) {
      setField("annualMileage", mileageOptions[0]);
      resetSelectedServices();
    }
  }, [form.annualMileage, mileageOptions, resetSelectedServices, setField]);

  const activeServiceRow = useMemo(() => {
    if (!catalog || !form.vehicleId) {
      return undefined;
    }

    const { brand, model } = decodeVehicleId(form.vehicleId);

    return catalog.services.find(
      (service) =>
        service.Marka === brand &&
        service.Model === model &&
        service.dlugosc_kontraktu === form.contractMonths &&
        service.przebieg_roczny === form.annualMileage
    );
  }, [catalog, form.annualMileage, form.contractMonths, form.vehicleId]);

  const handleClientTypeChange = useCallback(
    (_: unknown, value: ClientType | null) => {
      if (!value) {
        return;
      }
      setField("clientType", value);
    },
    [setField]
  );

  const handleFinancingTypeChange = useCallback(
    (_: unknown, value: FinancingType | null) => {
      if (!value) {
        return;
      }
      setFields({
        financingType: value,
        productCode: ""
      });
    },
    [setFields]
  );

  const handleProductChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFields({
        productCode: event.target.value
      });
    },
    [setFields]
  );

  const handleVehicleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFields({
        vehicleId: event.target.value
      });
      resetSelectedServices();
    },
    [resetSelectedServices, setFields]
  );

  const handleContractChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        setField("contractMonths", value);
        resetSelectedServices();
      }
    },
    [resetSelectedServices, setField]
  );

  const handleMileageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (Number.isFinite(value)) {
        setField("annualMileage", value);
        resetSelectedServices();
      }
    },
    [resetSelectedServices, setField]
  );

  const handlePriceChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setField("priceGross", Number.isFinite(value) ? Math.max(value, 0) : 0);
    },
    [setField]
  );

  const handleDownPaymentChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setField("downPaymentPct", Number.isFinite(value) ? clamp(value, 0, 100) : 0);
    },
    [setField]
  );

  const handleBalloonChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setField("balloonPct", Number.isFinite(value) ? clamp(value, 0, 100) : 0);
    },
    [setField]
  );

  const toggleService = useCallback(
    (key: keyof SelectedServices) =>
      (event: ChangeEvent<HTMLInputElement>, checked?: boolean) => {
        const nextValue = typeof checked === "boolean" ? checked : event.target.checked;
        setSelectedServices({ [key]: nextValue });
      },
    [setSelectedServices]
  );

  const downPaymentError =
    selectedProduct && form.downPaymentPct < selectedProduct.min_downpayment_pct;

  const balloonError =
    selectedProduct && form.balloonPct > selectedProduct.max_balloon_pct;

  const servicesUnavailable =
    activeServiceRow === undefined && Object.values(selectedServices).some(Boolean);

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" component="h2">
            Parametry finansowania
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dane pobierane w czasie rzeczywistym z arkusza Google (Apps Script). Wszystkie pola
            aktualizują wyniki w panelu po prawej stronie.
          </Typography>
        </Box>

        <Divider flexItem />

        {isLoading && (
          <Stack alignItems="center" spacing={1} py={4}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Ładuję konfigurację produktów z Google Sheets…
            </Typography>
          </Stack>
        )}

        {isError && (
          <Alert severity="error" variant="outlined">
            <AlertTitle>Nie udało się pobrać danych</AlertTitle>
            {error instanceof Error ? error.message : "Spróbuj ponownie za chwilę."}
          </Alert>
        )}

        {!isLoading && catalog && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rodzaj klienta
              </Typography>
              <ToggleButtonGroup
                value={form.clientType}
                exclusive
                onChange={handleClientTypeChange}
                size="small"
              >
                <ToggleButton value="business">Firma (B2B)</ToggleButton>
                <ToggleButton value="consumer">Konsument (B2C)</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Typ finansowania
              </Typography>
              <ToggleButtonGroup
                value={form.financingType}
                exclusive
                onChange={handleFinancingTypeChange}
                size="small"
              >
                <ToggleButton value="credit">Kredyt</ToggleButton>
                <ToggleButton value="leasing">Leasing</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack spacing={2}>
              <FormControl fullWidth>
                <TextField
                  select
                  label="Produkt finansowania"
                  value={form.productCode}
                  onChange={handleProductChange}
                  helperText={
                    selectedProduct
                      ? `Oprocentowanie roczne: ${
                          selectedProduct.WIBOR_Roczny +
                          selectedProduct.base_margin_pct +
                          selectedProduct.spread_pct +
                          selectedProduct.marga_dodatkowa
                        }%`
                      : undefined
                  }
                >
                  {activeProducts.map((product) => (
                    <MenuItem key={product.product_code} value={product.product_code}>
                      {product.product_name}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Pojazd"
                    value={form.vehicleId}
                    onChange={handleVehicleChange}
                  >
                    {vehicleOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Okres (miesiące)"
                    value={form.contractMonths}
                    onChange={handleContractChange}
                  >
                    {availableTerms.map((term) => (
                      <MenuItem key={term} value={term}>
                        {term}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Limit przebiegu (km/rok)"
                    value={form.annualMileage}
                    onChange={handleMileageChange}
                  >
                    {mileageOptions.map((mileage) => (
                      <MenuItem key={mileage} value={mileage}>
                        {mileage.toLocaleString("pl-PL")} km
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
                <FormControl fullWidth>
                  <TextField
                    type="number"
                    label="Cena brutto pojazdu"
                    value={form.priceGross}
                    onChange={handlePriceChange}
                    inputProps={{ min: 0, step: 500 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">PLN</InputAdornment>
                    }}
                  />
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <TextField
                    type="number"
                    label="Wpłata własna (%)"
                    value={form.downPaymentPct}
                    onChange={handleDownPaymentChange}
                    error={Boolean(downPaymentError)}
                    helperText={
                      selectedProduct
                        ? `Minimalna wpłata: ${selectedProduct.min_downpayment_pct}%`
                        : undefined
                    }
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <TextField
                    type="number"
                    label="Rata balonowa (%)"
                    value={form.balloonPct}
                    onChange={handleBalloonChange}
                    error={Boolean(balloonError)}
                    helperText={
                      selectedProduct
                        ? `Maks. balon: ${selectedProduct.max_balloon_pct}%`
                        : undefined
                    }
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                  />
                </FormControl>
              </Stack>
            </Stack>

            <Divider flexItem />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Usługi dodatkowe
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Stawki pobierane z arkusza dla wybranej marki, modelu, długości kontraktu oraz
                przebiegu.
              </Typography>
              {!activeServiceRow && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                  Dla tej konfiguracji brak zdefiniowanych usług w arkuszu. Zmień parametry lub
                  rozszerz dane źródłowe.
                </Alert>
              )}
              <FormGroup>
                {SERVICE_OPTIONS.map((service) => {
                  const monthlyAmount = activeServiceRow
                    ? Number(activeServiceRow[service.field]) || 0
                    : 0;

                  return (
                    <FormControlLabel
                      key={service.key}
                      control={
                        <Checkbox
                          checked={selectedServices[service.key]}
                          onChange={toggleService(service.key)}
                          disabled={!activeServiceRow}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="baseline">
                          <Typography>{service.label}</Typography>
                          {activeServiceRow && (
                            <Typography variant="caption" color="text.secondary">
                              {monthlyAmount.toLocaleString("pl-PL", {
                                style: "currency",
                                currency: "PLN"
                              })}
                              {" / mc"}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                  );
                })}
              </FormGroup>
              {servicesUnavailable && (
                <Typography variant="caption" color="error">
                  Usługi zaznaczone, ale brak stawek w arkuszu – nie zostaną uwzględnione w kalkulacji.
                </Typography>
              )}
            </Box>

            <Divider flexItem />

            <Typography variant="body2" color="text.secondary">
              Dostępne produkty: kredyt ({catalog.creditProducts.length}), leasing (
              {catalog.leasingProducts.length}). Łącznie zdefiniowanych konfiguracji usług:{" "}
              {catalog.services.length}.
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
