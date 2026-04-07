import { contextBridge } from 'electron';

// The React app communicates with the backend over HTTP, so no IPC bridge is
// needed. This preload exists to satisfy contextIsolation and can be extended
// later (e.g. to expose native dialogs for file uploads).
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  electron: () => process.versions.electron,
});
