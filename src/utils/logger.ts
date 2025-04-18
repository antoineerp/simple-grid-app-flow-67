
export function logDebug(message: string, error?: Error) {
  console.log(`[FormaCert Debug] ${message}`);
  if (error) {
    console.error(`[FormaCert Error]`, error);
  }
}
