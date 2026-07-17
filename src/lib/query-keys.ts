export const queryKeys = {
  attendance: {
    all: ["attendance"] as const,
    list: (month: number, year: number) => ["attendance", month, year] as const,
    last: ["attendance", "last"] as const,
  },
  analysis: (month: number, year: number) => ["analysis", month, year] as const,
  reports: {
    all: ["reports"] as const,
    list: (month: number, year: number) => ["reports", month, year] as const,
  },
  profile: ["profile"] as const,
  notificationPrefs: ["notifications", "preferences"] as const,
  notifications: {
    all: ["notifications"] as const,
    list: ["notifications", "list"] as const,
  },
  obstacles: {
    all: ["obstacles"] as const,
    list: ["obstacles"] as const,
  },
} as const;
