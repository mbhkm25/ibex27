export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.process !== undefined && 
         (window.process as any).type === 'renderer';
};

