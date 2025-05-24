
// Configuration centralisée de l'application
export const APP_CONFIG = {
  api: {
    baseUrl: `${window.location.origin}/api`,
    timeout: 15000
  },
  database: {
    host: "p71x6d.myd.infomaniak.com",
    name: "p71x6d_richard",
    user: "p71x6d_richard"
  },
  auth: {
    tokenKey: "authToken",
    userKey: "currentUser",
    roleKey: "userRole"
  }
} as const;
