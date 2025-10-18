import { z } from "zod";

const numeric = z.coerce.number();

export const financingProductSchema = z.object({
  product_code: z.string(),
  product_name: z.string(),
  WIBOR_Roczny: numeric,
  base_margin_pct: numeric,
  spread_pct: numeric,
  min_downpayment_pct: numeric,
  max_term: numeric,
  max_balloon_pct: numeric,
  marga_dodatkowa: numeric
});

export const serviceSchema = z.object({
  Marka: z.string(),
  Model: z.string(),
  dlugosc_kontraktu: numeric,
  przebieg_roczny: numeric,
  Insurance_Rate: numeric,
  Tyre_Rate: numeric,
  Service_Rate: numeric,
  SZ_14D: numeric
});

export const vehicleSchema = z.object({
  Marka: z.string(),
  Model: z.string()
});

export const spreadsheetCatalogSchema = z.object({
  Produkty_Kredyt: z.array(financingProductSchema),
  Produkty_Leasing: z.array(financingProductSchema),
  Uslugi: z.array(serviceSchema),
  Samochody: z.array(vehicleSchema)
});

export const catalogSchema = z.object({
  creditProducts: z.array(financingProductSchema),
  leasingProducts: z.array(financingProductSchema),
  services: z.array(serviceSchema),
  vehicles: z.array(vehicleSchema)
});

export type FinancingProduct = z.infer<typeof financingProductSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type SpreadsheetCatalog = z.infer<typeof spreadsheetCatalogSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
