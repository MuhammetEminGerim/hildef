declare global {
  interface Window {
    electronAPI?: {
      invoke: <T = unknown>(channel: string, ...args: any[]) => Promise<T>;
    };
  }
}

export function ipcInvoke<T = unknown>(
  channel: string,
  ...args: any[]
): Promise<T> {
  if (!window.electronAPI) {
    // Tarayıcıda çalışıyorsa, sessizce boş bir promise döndür
    // Bu sayede hata mesajı gösterilmez ve uygulama çökmez
    console.warn('Electron API yüklü değil. Bu uygulama Electron içinde çalışmalıdır.');
    return Promise.resolve({} as T);
  }
  return window.electronAPI.invoke<T>(channel, ...args);
}


