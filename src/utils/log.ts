export const createLogger = (namespace: string) => {
  return (...args: any[]) => {
    console.log(`[${new Date().toISOString()}][${namespace}]`, ...args);
  };
};
