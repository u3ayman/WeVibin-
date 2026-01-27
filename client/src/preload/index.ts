import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  selectAudioFolder: () => ipcRenderer.invoke('select-audio-folder'),
  readAudioFile: (filePath: string) =>
    ipcRenderer.invoke('read-audio-file', filePath),
  writeClipboard: (text: string) => ipcRenderer.invoke('write-clipboard', text),
});
