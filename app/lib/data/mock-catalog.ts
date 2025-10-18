import type { Catalog } from "../schemas";

export const mockCatalog: Catalog = {
  creditProducts: [
    {
      product_code: "KRE_STD",
      product_name: "Kredyt standard",
      WIBOR_Roczny: 5.75,
      base_margin_pct: 2,
      spread_pct: 10,
      min_downpayment_pct: 10,
      max_term: 84,
      max_balloon_pct: 40,
      marga_dodatkowa: 2
    }
  ],
  leasingProducts: [
    {
      product_code: "LEA_STD",
      product_name: "Leasing standard",
      WIBOR_Roczny: 5.75,
      base_margin_pct: 1,
      spread_pct: 10,
      min_downpayment_pct: 10,
      max_term: 60,
      max_balloon_pct: 40,
      marga_dodatkowa: 1
    }
  ],
  services: [
    {
      Marka: "Audi",
      Model: "Q3 35 TFSI 110 kW (150 KM) S tronic",
      dlugosc_kontraktu: 36,
      przebieg_roczny: 15000,
      Insurance_Rate: 406.73,
      Tyre_Rate: 99.88,
      Service_Rate: 184.36,
      SZ_14D: 50
    }
  ],
  vehicles: [
    {
      Marka: "Audi",
      Model: "A5 Avant TFSI 150 kW (204 KM) S tronic"
    },
    {
      Marka: "Audi",
      Model: "Q3 35 TFSI 110 kW (150 KM) S tronic"
    }
  ]
};
