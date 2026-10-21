# Techlead Desk · Desktop

A edição Electron compartilha a branch `main` e a mesma entrada `app.js` da versão web. Ela mantém tarefas, assuntos, feedbacks, agenda, notas, anexos e o mesmo formato JSON da versão web.

## Rodar no seu computador

Instale Node.js 22 ou mais recente. Na cópia do repositório:

```bash
git fetch origin
git switch main
npm ci
npm start
```

Para desenvolvimento, `npm run dev` libera as ferramentas do Chromium no menu Visualizar.

## O que muda

- Janela própria, barra de título discreta, controles de janela e interface refinada.
- Abrir/criar JSON pelo seletor nativo. `Ctrl+O`, `Ctrl+N` e `Ctrl+S` funcionam também com `Cmd` no macOS.
- Gravações automáticas no JSON selecionado, com backup da versão anterior em `arquivo.json.bak`.
- Se o JSON for alterado externamente, o app bloqueia a próxima gravação. Reabra o arquivo para continuar sem sobrescrever alterações externas.
- Cartões desktop no canto inferior direito, com título, contexto, horário e ação **Ver no Desk**. Até três ficam visíveis; os anteriores continuam na central interna de alertas.
- Fechar a janela oculta o aplicativo na bandeja quando ela está disponível. Os alertas continuam ativos. Para encerrar, use **Sair** na bandeja ou `Ctrl+Q`/`Cmd+Q`.
- Se a bandeja não puder ser criada, o botão fechar encerra o aplicativo. Nenhum processo invisível é mantido nessa situação.
- Nas preferências de alertas, escolha centro, canto superior/inferior direito ou canto superior/inferior esquerdo. Ajuste o tempo de cada cartão entre 3 e 120 segundos. O teste aplica as escolhas ainda não salvas; Salvar preferências grava tudo no JSON. No modo de notificações nativas, posição e duração são definidas pelo sistema operacional.
- Som, toque, volume e antecedência continuam nas preferências do seu JSON. Ative os alertas depois de abrir o arquivo. O teste do cartão também está no menu nativo **Alertas**.
- Sem conta, servidor ou sincronização. As únicas preferências separadas do JSON são o tamanho e o estado da janela, no diretório de configuração do aplicativo.

O aplicativo precisa estar em execução e um JSON precisa estar aberto para monitorar os compromissos. Suspensão, desligamento e saída completa interrompem os alertas. Após suspensão, os avisos são reavaliados com a tolerância de dez minutos já usada no sistema. O JSON é aberto explicitamente a cada sessão.

No Ubuntu/Linux, o Desk usa X11/XWayland automaticamente quando `DISPLAY` está disponível, para respeitar a posição dos cartões. O atalho Linux já inclui o backend correto. Em uma execução direta sem esse parâmetro, o app reinicia uma única vez antes de abrir o JSON para selecionar XWayland no início do processo. Um backend definido explicitamente por `--ozone-platform` é preservado. Não é necessário trocar sua sessão do Ubuntu.

Em ambientes sem XWayland, use as notificações nativas do sistema (nesse modo, o sistema escolhe a posição):

```bash
npm start -- --native-notifications
```

Notificações nativas dependem das permissões e do modo Não perturbe do sistema operacional. Os cartões próprios não usam a autorização de sites do Chrome.

## Gerar instaladores

```bash
npm test
npm run pack        # aplicativo descompactado para testar
npm run dist:linux  # AppImage e .deb
npm run dist:win    # instalador NSIS (.exe), executar no Windows
npm run dist:mac    # .dmg, executar no macOS
```

As saídas ficam em `release/`. O workflow **Desktop builds** executa testes e cria os pacotes nos três sistemas a cada push na branch `main`. Baixe os arquivos na seção **Artifacts** da execução no GitHub Actions.

Os pacotes deste projeto não têm assinatura de distribuição ou notarização configurada. Assinatura Windows/macOS e publicação de atualizações automáticas precisam de certificados próprios e não estão habilitadas. Não são necessários para desenvolver e testar localmente.

## Arquitetura

- `desktop/main.cjs`: ciclo de vida, bandeja, menus, IPC autorizado e notificações.
- `desktop/preload.cjs`: ponte limitada. O renderer não recebe Node.js nem acesso livre ao disco.
- `desktop/file-service.cjs`: capacidades de arquivo por token, validação, gravação temporária/rename, backup e detecção de conflito.
- `desktop/file-adapter.js`: mantém a interface do `FileStore` existente, trocando apenas os seletores e a persistência por operações nativas.
- `desktop/renderer.js` e `desktop/desktop.css`: barra de título e refinamento visual, reutilizando os módulos funcionais existentes.
- `desktop/notification.*`: janela independente de alerta; dados são inseridos como texto, sem HTML vindo do JSON.

O renderer usa sandbox e isolamento de contexto, não carrega código remoto e só abre links HTTP/HTTPS no navegador externo. Anexos continuam sendo dados do JSON e são exportados pelo fluxo de download existente.

## Verificação

`npm test` inclui os testes existentes e os de persistência nativa. Para o teste de integração de janela real:

```bash
npm run test:electron
# Linux sem sessão gráfica:
xvfb-run -a npm run test:electron
```

O runner usa um diretório temporário e simula somente a escolha dos caminhos nos diálogos; a leitura, escrita, IPC, renderização e janelas de alerta são reais. A bandeja e a apresentação sobre outros aplicativos precisam ser conferidas em uma sessão desktop do sistema alvo.

A entrada compartilhada `app.js` detecta a ponte segura do Electron e inicializa apenas nesse ambiente os seletores e controles nativos. No navegador ela usa a File System Access API. `python3 unificar.py -o dist/techlead-desk-unico.html` gera a versão web independente, com o mesmo visual e recursos compartilhados.

### Abertura e modais (1.2.0)

Cada inicialização do processo exibe um splash animado por pelo menos 1,6 segundo, enquanto a janela principal carrega. Restaurar a janela pela bandeja não repete a abertura. A animação respeita a preferência de movimento reduzido do sistema.

Os modais de edição, confirmação, prévia de anexos e alertas mantêm título e botão de fechar fora da área de rolagem. Somente o conteúdo interno rola; os botões de rodapé dos formulários permanecem acessíveis.
