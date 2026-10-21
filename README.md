# Techlead Desk

Um espaço pessoal para organizar o dia de quem lidera tecnologia: tarefas, assuntos, feedbacks, agenda, notas e anexos, com alertas visuais e sonoros. Funciona no navegador ou como aplicativo Electron. Os dados ficam em um arquivo JSON local, sem conta e sem envio para servidores.

![Visão geral do Techlead Desk](docs/techlead-desk.png)

[Conheça as demais telas e funcionalidades →](FUNCIONALIDADES.md)

## Como rodar

### Navegador

Com Python 3, na pasta do projeto:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Abra **http://localhost:8080** no Chrome ou Edge. Também pode usar `sh iniciar.sh` no Linux/macOS ou `iniciar.bat` no Windows. Não precisa instalar dependências Node para esse modo.

### Aplicativo Electron

Com Node.js 22 ou mais recente:

```bash
npm ci
npm start
```

Ao abrir, crie um arquivo JSON ou selecione o seu arquivo existente. O mesmo JSON funciona na web e no aplicativo.

## Gerar artefatos

### HTML único

Com Python 3:

```bash
python3 unificar.py -o dist/techlead-desk-unico.html
```

Abra o HTML gerado diretamente no Chrome ou Edge. O JSON de dados continua separado. Se já usa npm, o comando equivalente é `npm run build:web`.

### Aplicativos e instaladores

Após `npm ci`, execute o comando no sistema correspondente:

| Sistema | Comando | Artefatos |
| --- | --- | --- |
| Linux | `npm run dist:linux` | `.AppImage` e `.deb` |
| macOS | `npm run dist:mac` | `.dmg` |
| Windows | `npm run dist:win` | `.exe` |

As saídas ficam em `release/`. Para gerar somente o aplicativo descompactado, use `npm run pack`.

O [GitHub Actions](https://github.com/sl4ureano/Techlead-Desk/actions/workflows/desktop.yml) também gera o HTML único e os pacotes dos três sistemas. Baixe-os em **Artifacts** na execução concluída.
