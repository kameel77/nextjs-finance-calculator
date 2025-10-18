import Papa from "papaparse";
import { NextResponse } from "next/server";

import {
  catalogSchema,
  spreadsheetCatalogSchema,
  type Catalog,
  type SpreadsheetCatalog
} from "../../lib/schemas";
import { mockCatalog } from "../../lib/data/mock-catalog";

const DEFAULT_SHEET_ID = "1g1zHJ_9MNJVa4JnzexAApJvQ1m8WEh4mZRlgFfvHa-M";

const shouldSkipRemoteFetch =
  process.env.CATALOG_FETCH_STRATEGY === "mock" ||
  process.env.DISABLE_REMOTE_FETCH === "true" ||
  (process.env.NEXT_PHASE === "phase-production-build" && process.env.ENABLE_REMOTE_CATALOG !== "true");

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

    if (shouldSkipRemoteFetch) {
      return NextResponse.json(mockCatalog, {
        headers: {
          "Cache-Control": "no-store",
          "X-Data-Source": "fallback"
        }
      });
    }

    const results = await Promise.allSettled(
      SHEET_NAMES.map(async (sheet) => {
        const data = await fetchSheet(sheetId, sheet);
        return [sheet, data] as const;
      })
    );

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<readonly [string, SheetRow[]]> =>
        result.status === "fulfilled"
    );

    if (fulfilled.length !== SHEET_NAMES.length) {
      throw new Error("Nie udało się pobrać wszystkich zakładek arkusza.");
    }

    const rawPayload = Object.fromEntries(fulfilled.map((result) => result.value));
    const spreadsheetPayload = spreadsheetCatalogSchema.parse(rawPayload);
    const catalog = toCatalog(spreadsheetPayload);

    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60"
      }
    });
  } catch (error) {
    console.warn(
      "Catalog API – fallback to mock data:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(mockCatalog, {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": "fallback"
      },
      status: 200
    });
  }
}
