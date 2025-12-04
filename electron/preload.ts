import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  invoke: <T = unknown>(channel: string, ...args: any[]): Promise<T> =>
    ipcRenderer.invoke(channel, ...args),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;


