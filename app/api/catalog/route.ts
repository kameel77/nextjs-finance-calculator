import Papa from "papaparse";
import { NextResponse } from "next/server";

import {
  catalogSchema,
  spreadsheetCatalogSchema,
  type Catalog,
  type SpreadsheetCatalog
} from "../../lib/schemas";

const DEFAULT_SHEET_ID = "1g1zHJ_9MNJVa4JnzexAApJvQ1m8WEh4mZRlgFfvHa-M";

const NUMERIC_FIELDS_BY_SHEET: Record<string, string[]> = {
  Produkty_Kredyt: [
    "WIBOR_Roczny",
    "base_margin_pct",
    "spread_pct",
    "min_downpayment_pct",
    "max_term",
    "max_balloon_pct",
    "marga_dodatkowa"
  ],
  Produkty_Leasing: [
    "WIBOR_Roczny",
    "base_margin_pct",
    "spread_pct",
    "min_downpayment_pct",
    "max_term",
    "max_balloon_pct",
    "marga_dodatkowa"
  ],
  Uslugi: [
    "dlugosc_kontraktu",
    "przebieg_roczny",
    "Insurance_Rate",
    "Tyre_Rate",
    "Service_Rate",
    "SZ_14D"
  ],
  Samochody: []
};

const SHEET_NAMES = Object.keys(NUMERIC_FIELDS_BY_SHEET);

type SheetRow = Record<string, string>;

const normalizeNumericFields = (row: SheetRow, fields: string[]) => {
  const result: SheetRow = { ...row };

  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string") {
      result[field] = value.replace(",", ".").trim();
    }
  }

  return result;
};

const parseCsv = (text: string, numericFields: string[]): SheetRow[] => {
  const parsed = Papa.parse<SheetRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  if (parsed.errors.length > 0) {
    const [error] = parsed.errors;
    throw new Error(
      `Błąd parsowania CSV (${error.code ?? "unknown"}): ${error.message} (row ${error.row})`
    );
  }

  return parsed.data.map((row) => normalizeNumericFields(row, numericFields));
};

const fetchSheet = async (sheetId: string, sheetName: string): Promise<SheetRow[]> => {
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      sheetName
    )}`
  );

  const response = await fetch(url.toString(), {
    // allow revalidation on the edge/cache layer if deployed
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać arkusza "${sheetName}" (status ${response.status}).`);
  }

  const csv = await response.text();
  return parseCsv(csv, NUMERIC_FIELDS_BY_SHEET[sheetName] ?? []);
};

const toCatalog = (payload: SpreadsheetCatalog): Catalog =>
  catalogSchema.parse({
    creditProducts: payload.Produkty_Kredyt,
    leasingProducts: payload.Produkty_Leasing,
    services: payload.Uslugi,
    vehicles: payload.Samochody
  });

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID ?? DEFAULT_SHEET_ID;

    const entries = await Promise.all(
      SHEET_NAMES.map(async (sheet) => {
        const data = await fetchSheet(sheetId, sheet);
        return [sheet, data] as const;
      })
    );

    const rawPayload = Object.fromEntries(entries);
    const spreadsheetPayload = spreadsheetCatalogSchema.parse(rawPayload);
    const catalog = toCatalog(spreadsheetPayload);

    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60"
      }
    });
  } catch (error) {
    console.error("Catalog API error", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać danych katalogowych z Google Sheets."
      },
      { status: 500 }
    );
  }
}
