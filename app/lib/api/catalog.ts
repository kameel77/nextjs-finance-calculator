import {
  catalogSchema,
  spreadsheetCatalogSchema,
  type Catalog,
  type SpreadsheetCatalog
} from "../schemas";

const DEFAULT_ACTION = "getAll";

export const catalogQueryKey = ["catalog"];

const transformCatalog = (payload: SpreadsheetCatalog): Catalog => {
  const catalog = {
    creditProducts: payload.Produkty_Kredyt,
    leasingProducts: payload.Produkty_Leasing,
    services: payload.Uslugi,
    vehicles: payload.Samochody
  };

  return catalogSchema.parse(catalog);
};

export async function fetchCatalog({
  signal
}: {
  signal?: AbortSignal;
} = {}): Promise<Catalog> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    let requestUrl = "/api/catalog";

    if (baseUrl) {
      const url = new URL(baseUrl);
      if (!url.searchParams.has("action")) {
        url.searchParams.set("action", DEFAULT_ACTION);
      }
      requestUrl = url.toString();
    }

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Nie udało się pobrać danych (status ${response.status}).`);
    }

    const data = await response.json();

    if ("creditProducts" in data) {
      return catalogSchema.parse(data);
    }

    const parsed = spreadsheetCatalogSchema.parse(data);
    return transformCatalog(parsed);
  } catch (error) {
    console.error("fetchCatalog error", error);
    throw error;
  }
}
