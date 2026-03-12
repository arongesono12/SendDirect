export interface TariffRange {
  min: number;
  max: number;
  commission: number;
}

export const nationalTariffs: TariffRange[] = [
  { min: 1000, max: 20000, commission: 500 },
  { min: 20001, max: 50000, commission: 1000 },
  { min: 50001, max: 85000, commission: 2000 },
  { min: 85001, max: 160000, commission: 2500 },
  { min: 160001, max: 250000, commission: 3000 },
  { min: 250001, max: 350000, commission: 3500 },
  { min: 350001, max: 400000, commission: 4000 },
  { min: 400001, max: 500000, commission: 6000 },
  { min: 500001, max: 750000, commission: 7000 },
  { min: 750001, max: 900000, commission: 9000 },
  { min: 900001, max: 1200000, commission: 11000 },
  { min: 1200001, max: 1500000, commission: 16000 },
  { min: 1500001, max: 2000000, commission: 18000 },
];

export function calculateCommission(amount: number): number {
  for (const tariff of nationalTariffs) {
    if (amount >= tariff.min && amount <= tariff.max) {
      return tariff.commission;
    }
  }
  return 0;
}

export function getTariffInfo(amount: number): TariffRange | null {
  for (const tariff of nationalTariffs) {
    if (amount >= tariff.min && amount <= tariff.max) {
      return tariff;
    }
  }
  return null;
}
