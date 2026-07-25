export type SettingsView = {
  displayName: string | null;
  currency: string;
  aiContextEnabled: boolean;
  notificationsEnabled: boolean;
  onboardedAt: string | null;
};

export const CURRENCY_OPTIONS = ["₹", "$", "€", "£", "¥", "₩", "A$", "C$"];
