import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
});
