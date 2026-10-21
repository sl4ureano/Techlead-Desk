'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID, createHash} = require('node:crypto');
const digest = text => createHash('sha256').update(text).digest('hex');

// Only paths selected by a native dialog become capabilities. Renderers see opaque tokens.
class FileService {
  constructor(validate) { this.validate = validate; this.handles = new Map(); }
  async select(filename, {create = false} = {}) {
    if (path.extname(filename).toLowerCase() !== '.json') throw Error('Escolha um arquivo .json.');
    filename = path.resolve(filename);
    const info = await fs.lstat(filename).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
    if (info && (!info.isFile() || info.isSymbolicLink())) throw Error('Escolha um arquivo regular, sem links simbólicos.');
    if (!info && !create) throw Error('Arquivo não encontrado.');
    const text = info ? await fs.readFile(filename, 'utf8') : null;
    if (!create && text !== null) this.validate(JSON.parse(text));
    const token = randomUUID();
    this.handles.set(token, {filename, hash: text === null ? null : digest(text), queue: Promise.resolve()});
    return {token, name: path.basename(filename)};
  }
  handle(token) { const handle = this.handles.get(token); if (!handle) throw Error('Arquivo não autorizado. Abra-o novamente.'); return handle; }
  async read(token) { return fs.readFile(this.handle(token).filename, 'utf8'); }
  write(token, text) {
    const handle = this.handle(token);
    if (typeof text !== 'string' || Buffer.byteLength(text) > 256 * 1024 * 1024) throw Error('Arquivo inválido ou maior que 256 MB.');
    this.validate(JSON.parse(text));
    const operation = handle.queue.then(async () => {
      const info = await fs.lstat(handle.filename).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
      if (info && (!info.isFile() || info.isSymbolicLink())) throw Error('O arquivo selecionado mudou de tipo. Abra-o novamente.');
      const current = info ? await fs.readFile(handle.filename, 'utf8') : null;
      if ((current === null ? null : digest(current)) !== handle.hash) throw Error('O JSON foi alterado fora do aplicativo. Reabra-o antes de salvar para evitar perda de dados.');
      const temporary = handle.filename + '.' + randomUUID() + '.tmp';
      try {
        await fs.writeFile(temporary, text, {encoding:'utf8', mode:0o600, flag:'wx'});
        // Replace a backup atomically; never follow an existing .bak symlink.
        if (current !== null) {
          const backupTemp = temporary + '.bak';
          try { await fs.writeFile(backupTemp, current, {encoding:'utf8', mode:0o600, flag:'wx'}); await fs.rename(backupTemp, handle.filename + '.bak'); }
          finally { await fs.rm(backupTemp, {force:true}); }
        }
        await fs.rename(temporary, handle.filename);
        handle.hash = digest(text);
      } finally { await fs.rm(temporary, {force:true}); }
    });
    handle.queue = operation.catch(() => {});
    return operation;
  }
}
module.exports = {FileService};
