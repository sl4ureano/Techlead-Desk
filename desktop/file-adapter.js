// Adapt native, capability-scoped IPC to the FileStore interface used by the web app.
export function nativeHandle(api, descriptor) {
  if (!descriptor) throw new DOMException('Seleção cancelada.', 'AbortError');
  return {
    name: descriptor.name,
    requestPermission: async () => 'granted',
    getFile: async () => ({text: () => api.fileRead(descriptor.token)}),
    createWritable: async () => {
      let buffer, aborted = false, closed = false;
      return {
        write: async text => { if (aborted || closed) throw Error('Gravação encerrada.'); buffer = text; },
        close: async () => { if (aborted || closed) throw Error('Gravação encerrada.'); if (buffer === undefined) throw Error('Nenhum conteúdo para gravar.'); await api.fileWrite(descriptor.token, buffer); closed = true; },
        abort: async () => { aborted = true; buffer = undefined; }
      };
    }
  };
}
