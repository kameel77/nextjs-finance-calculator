import { create } from "zustand";

import type {
  ClientType,
  FinancingType,
  SelectedServices
} from "../lib/calculations";

export type VehicleMode = "catalog" | "custom";

type CalculatorFormState = {
  clientType: ClientType;
  financingType: FinancingType;
  vehicleMode: VehicleMode;
  productCode: string;
  vehicleId: string;
  customBrand: string;
  customModel: string;
  customTrim: string;
  contractMonths: number;
  annualMileage: number;
  listPriceGross: number;
  priceGross: number;
  downPaymentPct: number;
  balloonPct: number;
  extraMarginPct: number;
};

type CalculatorState = {
  form: CalculatorFormState;
  selectedServices: SelectedServices;
  setField: <K extends keyof CalculatorFormState>(
    key: K,
    value: CalculatorFormState[K]
  ) => void;
  setFields: (patch: Partial<CalculatorFormState>) => void;
  setSelectedServices: (patch: Partial<SelectedServices>) => void;
  resetSelectedServices: () => void;
};

const DEFAULT_FORM_STATE: CalculatorFormState = {
  clientType: "business",
  financingType: "credit",
  vehicleMode: "catalog",
  productCode: "",
  vehicleId: "",
  customBrand: "",
  customModel: "",
  customTrim: "",
  contractMonths: 36,
  annualMileage: 20000,
  listPriceGross: 180000,
  priceGross: 180000,
  downPaymentPct: 10,
  balloonPct: 20,
  extraMarginPct: 0
};

const EMPTY_SERVICES: SelectedServices = {
  insurance: false,
  tyre: false,
  service: false,
  assistance: false
};

const cloneServices = (patch: Partial<SelectedServices>) => ({
  insurance: patch.insurance ?? false,
  tyre: patch.tyre ?? false,
  service: patch.service ?? false,
  assistance: patch.assistance ?? false
});

export const useCalculatorStore = create<CalculatorState>((set) => ({
  form: DEFAULT_FORM_STATE,
  selectedServices: EMPTY_SERVICES,
  setField: (key, value) =>
    set((state) => ({
      form: {
        ...state.form,
        [key]: value
      }
    })),
  setFields: (patch) =>
    set((state) => ({
      form: {
        ...state.form,
        ...patch
      }
    })),
  setSelectedServices: (patch) =>
    set((state) => ({
      selectedServices: {
        ...state.selectedServices,
        ...patch
      }
    })),
  resetSelectedServices: () =>
    set(() => ({
      selectedServices: cloneServices({})
    }))
}));
