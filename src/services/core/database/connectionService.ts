
// Database connection service
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

export const getCurrentUser = (): string | null => currentUser;
export const getLastConnectionError = (): string | null => lastConnectionError;

