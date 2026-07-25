export type SettingsView = {
  displayName: string | null;
  currency: string;
  aiContextEnabled: boolean;
};

export const CURRENCY_OPTIONS = ["₹", "$", "€", "£", "¥", "₩", "A$", "C$"];
