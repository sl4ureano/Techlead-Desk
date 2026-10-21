# Techlead Desk · Web e Electron

Uma única base na branch `main`: use no navegador ou gere um aplicativo Electron. Tarefas, assuntos, feedbacks, agenda, notas, anexos, visual, modais e preferências compartilham o mesmo código e o mesmo JSON local. Não é necessário trocar de branch para mudar de ambiente.

## Início rápido

Use sempre a branch `main`, que reúne todos os ajustes antes feitos na branch `electron`.

| Objetivo | Comando |
| --- | --- |
| Abrir no navegador | `sh iniciar.sh` (Linux/macOS) ou `iniciar.bat` (Windows) |
| Gerar um HTML único | `python3 unificar.py -o dist/techlead-desk-unico.html` ou `npm run build:web` |
| Rodar no Electron | `npm ci` e depois `npm start` |
| Gerar aplicativo Linux | `npm run dist:linux` |
| Gerar aplicativo macOS | `npm run dist:mac` (no macOS) |
| Gerar aplicativo Windows | `npm run dist:win` (no Windows) |

Os comandos `npm` precisam de Node.js 22+ e, antes do primeiro uso, `npm ci`. Para os comandos web via Python, basta Python 3. Os aplicativos gerados ficam em `release/`; o HTML único fica em `dist/`. Web e Electron abrem o mesmo formato de arquivo JSON.

## Usar no navegador, sem instalar o aplicativo

Com Python 3, execute `iniciar.sh` (Linux/macOS) ou `iniciar.bat` (Windows) e abra **http://localhost:8080** no Chrome ou Edge. Também pode executar:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Não precisa instalar Node nem dependências para usar a versão web. Para levar tudo em um único HTML:

```bash
python3 unificar.py -o dist/techlead-desk-unico.html
```

Abra `dist/techlead-desk-unico.html` no Chrome/Edge, inclusive por duplo clique. Ele incorpora scripts, estilos e splash; seu arquivo JSON de dados continua separado. Para servir os módulos originais, use localhost ou HTTPS.

## Rodar ou gerar o aplicativo

Com Node.js 22 ou mais recente:

```bash
npm ci
npm start          # Electron
npm run dist:linux # Linux: AppImage e .deb
npm run dist:mac   # macOS: .dmg, executar no macOS
npm run dist:win   # Windows: .exe, executar no Windows
```

Veja [DESKTOP.md](DESKTOP.md) para detalhes. Atalhos adicionais: `npm run start:web`, `npm run build:web`, `npm test`, `npm run test:web` e `npm run test:electron`.

## Recursos compartilhados e diferenças do ambiente

- Splash animado ao abrir, cabeçalhos dos modais fixos, navegação sempre no topo, menu de ações e menu **Arquivo → Trocar arquivo**.
- Sons, volume, antecedência, posição e duração dos avisos ficam no mesmo JSON, compatível entre os dois modos.
- Na web, posição e duração controlam os avisos dentro da página. As notificações do Chrome dependem de permissão; sua apresentação é controlada pelo navegador/sistema. Mantenha a aba aberta; avisos em segundo plano podem atrasar.
- No Electron, os cartões aparecem sobre a área de trabalho e o aplicativo pode continuar na bandeja. Use **Arquivo → Sair do aplicativo** para encerrar. Seletores nativos e backup `.bak` continuam disponíveis.
- Abra seu JSON explicitamente em cada sessão. Evite editar o mesmo arquivo simultaneamente no navegador e no aplicativo.

A integração contínua testa a versão web e o Electron e disponibiliza o HTML único e os instaladores em **Artifacts**. O restante deste documento registra os recursos e a evolução do projeto.

---

# Feedbacks

A área **Feedbacks** reúne **A compartilhar**, **Recebidos** e **Todos**. Registre pessoa, relação (Time, PM, PA, Liderança ou Outra pessoa), assunto, data da conversa, contexto, comportamento e impacto, próximo passo e data/hora de acompanhamento.

Use **Novo feedback** para cadastrar; **Editar feedback** para ajustar; **Registrar atualização** para acrescentar conversas e combinados com data e hora. A busca inclui pessoa, contexto, conteúdo e atualizações. Etapas disponíveis: Preparar, Conversar, Refletir, Agir, Acompanhar e Encerrado.

**Criar tarefa** abre um formulário preenchido e vinculado ao feedback. Para associar uma tarefa existente, edite a tarefa e escolha **Feedback vinculado**. As tarefas aparecem dentro do feedback. Excluir um feedback pede confirmação e mantém suas tarefas, removendo apenas o vínculo.

Com os alertas de trabalho ativos, acompanhamentos com data e hora avisam antes e no horário marcado; encerrados não avisam. O aviso abre a lista de feedbacks. As datas ficam no próprio registro, sem criar compromissos na Agenda.

Tudo é um registro pessoal no mesmo JSON local, sem envio de mensagens. Arquivos anteriores sem feedbacks continuam compatíveis. A logo foi preservada.

# Cinco sons de notificação

Em **Alertas**, escolha Alerta clássico, Campainha, Alerta insistente, Chamada crescente ou Toque digital. **Testar som** reproduz a opção selecionada antes de salvar. Clique em **Salvar preferências** para gravar a escolha no JSON. Arquivos antigos usam Alerta clássico por padrão.

# Som dos alertas e rodapé

O alerta agora toca duas sequências de três notas, com volume e duração maiores. Use **Alertas → Testar som** para ouvir. O rodapé mostra **2026 - made by Didico**.

# Notas & ideias: remoção de Guardar como histórico

Notas & ideias permite guardar ideias e criar tarefas a partir do rascunho. A opção **Guardar como histórico** e o seletor **Tipo de registro** foram removidos. Novos registros são ideias. Para acompanhar assuntos, use **Assuntos**.

Históricos já salvos continuam disponíveis, pesquisáveis e editáveis, com suas atualizações e vínculos preservados no mesmo JSON.

Execute `npm test` para rodar a suíte de testes.

As seções abaixo documentam versões anteriores; esta alteração prevalece sobre as instruções antigas de criação de históricos em Notas & ideias.

# Tarefas: estados e vínculos com assuntos

A tarefa pode estar **Em aberto**, **Em andamento** ou **Concluída**. Os cartões têm botões Iniciar, Concluir e Reabrir, conforme o estado; a caixa de marcar foi removida. O formulário também permite selecionar os três estados. Cada mudança é registrada no histórico.

A lista **Pendentes** inclui abertas e em andamento; **Em andamento** mostra só as iniciadas; **Concluídas** e **Todas** completam as visões. As tarefas em andamento continuam nos alertas, agenda e indicadores de trabalho pendente. Arquivos antigos com dois estados permanecem válidos.

## Associar tarefa e assunto

- Na tarefa: escolha **Assunto vinculado** ao criar ou editar. O cartão mostra um link para abrir o assunto.
- No assunto: em **Tarefas deste assunto**, use **Nova tarefa** ou **Associar existente**. Uma nova tarefa recebe o responsável e próximo passo como preenchimento inicial, editável antes de salvar.
- O assunto lista todas as tarefas vinculadas, com links para abri-las e botões para iniciar/concluir/reabrir. Um assunto pode ter várias tarefas; cada tarefa tem no máximo um assunto.
- Associar uma tarefa que já pertence a outro assunto transfere o vínculo, com aviso no formulário e registro nos históricos envolvidos.
- **Desvincular** remove somente a ligação. Excluir um assunto mantém as tarefas e remove seus vínculos. Concluir/reabrir uma tarefa não altera automaticamente o status do assunto.

O campo opcional `topicId` fica na tarefa. A lista do assunto é calculada a partir dele, evitando cópias de dados ou relações duplicadas.

Extraia em pasta nova, execute iniciar.sh/iniciar.bat e recarregue Ctrl+Shift+R. Confira **Tarefas vinculadas** no rodapé. Abra seu JSON atual normalmente. O projeto mantém HTML, CSS e JavaScript separados.

As notas abaixo são o histórico de versões anteriores; as ações atuais estão descritas acima.

---

# Cartões de tarefas — apresentação atual

A lista de tarefas mantém Em aberto, Concluídas, Todas e busca, agora com cartões mais organizados visualmente:

- Estado discreto no topo e prioridade em uma indicação curta.
- Título destacado, com projeto e responsável abaixo quando preenchidos.
- Prévia curta do próximo passo e prazo com hora em área própria.
- Ações Editar e Atualização sempre visíveis; caixa à esquerda para concluir.
- Detalhes/histórico e anexos recolhidos no rodapé do cartão. A descrição completa fica nos detalhes; a prévia pode mostrar só duas linhas.

A mesma apresentação é usada nas tarefas da visão geral. O modelo de dados, os alertas e o arquivo JSON continuam iguais.

Extraia em uma pasta nova, execute iniciar.sh/iniciar.bat e recarregue Ctrl+Shift+R. Confira **Cartões de tarefas** no rodapé e abra seu JSON habitual. O projeto continua em arquivos separados.

---

# Tarefas simples — versão atual

A tela de tarefas agora tem uma lista única, busca e três visões: **Em aberto**, **Concluídas** e **Todas**. Os contadores grandes e os grupos separados foram retirados.

- Na linha: título, prazo com data/hora, prioridade e projeto/responsável quando preenchidos.
- Marque a caixa à esquerda para concluir ou reabrir a tarefa.
- Clique no título para expandir descrição, edição, anotações, histórico e anexos.
- Excluir fica em Mais opções; limites de anexos ficam em Configurar anexos.
- O filtro de prioridade fica recolhido. A ordenação por urgência foi mantida.

Os cartões de tarefas da visão geral seguem o mesmo padrão compacto. Dados, alertas, anexos, histórico, horários e campos de edição continuam preservados. Não há migração nova dos dados de tarefas.

Extraia este ZIP em pasta nova, execute iniciar.sh/iniciar.bat e recarregue Ctrl+Shift+R. Confira **Tarefas simples** no rodapé e abra seu JSON habitual. HTML, CSS e JavaScript continuam separados.

As instruções anteriores abaixo são o histórico das versões; a organização atual de tarefas é a descrita acima.

---

# Assuntos e histórico — versão atual

O recurso separado de decisões foi removido. Use somente **Assuntos**:

1. Crie um assunto e indique o próximo passo.
2. Use **Atualizar assunto** para anotar conversas, escolhas e mudanças na linha do tempo.
3. Marque como resolvido ao terminar.

Não há formulário, botão, filtro ou indicador de decisões. O acompanhamento por data/hora e os alertas continuam funcionando para assuntos.

## Seus registros antigos

Ao abrir seu JSON, o aplicativo incorpora as decisões anteriores ao histórico do assunto vinculado. Quando não havia vínculo, cria um assunto com o título e contexto originais. Escolha, alternativas, responsável, data e atualizações anteriores são preservados; uma cópia completa do registro antigo fica na entrada do histórico (`legacyRecord`), incluindo campos desconhecidos. O processo não se repete em aberturas posteriores.

A coleção de compatibilidade `decisions` fica vazia após a conversão. O novo conteúdo é gravado no mesmo JSON escolhido, com os estados reais de gravação e tratamento de falhas já existentes. Não há cópia persistente no navegador.

Datas de acompanhamento são mantidas. Se um assunto já tinha outro horário, lembretes adicionais ficam em **Outros lembretes** dentro dele, onde podem ser removidos com confirmação sem apagar o histórico. Um registro com revisão que estava vinculado a assunto encerrado recebe um assunto aberto próprio, para manter seu acompanhamento sem reabrir o assunto encerrado.

Extraia este ZIP em pasta nova, execute iniciar.sh/iniciar.bat e pressione Ctrl+Shift+R. Confira **Assuntos e histórico** no rodapé do menu. Use seu JSON atual normalmente. O projeto permanece em HTML, CSS e JavaScript separados.

As notas anteriores abaixo são o histórico de versões e não descrevem os botões da interface atual.

---

# Assuntos simples — versão atual

A tela Assuntos agora funciona em três passos:

1. **Novo assunto:** escreva o título e o próximo passo. Se desejar, informe quem cuida e quando voltar ao assunto. Contexto adicional fica numa seção opcional.
2. **Abra o assunto:** use Atualizar assunto para registrar o que aconteceu. O histórico aparece em ordem cronológica, com data e hora.
3. **Encerre quando resolver:** Marcar como resolvido move o assunto para a lista Resolvidos. É possível reabrir depois.

Na lista aparecem somente título, próximo passo, responsável, status e data/hora de acompanhamento. Há uma busca e quatro visões: Em aberto, Aguardando resposta, Resolvidos e Todos. A busca também inclui contexto, histórico e decisões.

Se houver uma decisão, abra o assunto e escolha **O que foi decidido → Registrar decisão**. O formulário destaca título e escolha. Data, hora, responsável, alternativas, contexto e revisão ficam em detalhes opcionais, preservados no JSON. Decisões antigas continuam visíveis na mesma lista; seus históricos e alertas foram mantidos. Não há painel separado de organização para começar a usar.

Nada é convertido ou excluído ao abrir a nova versão. Tarefas, agenda, alertas, anexos e os outros recursos continuam disponíveis. O projeto mantém HTML, CSS e JavaScript separados.

Extraia em pasta nova, execute iniciar.sh/iniciar.bat e recarregue Ctrl+Shift+R. Confira **Assuntos simples** no rodapé do menu e abra seu JSON habitual.

As notas das versões anteriores abaixo descrevem o histórico do projeto. Para o uso atual de Assuntos, considere as instruções desta seção.

---

# Assuntos unificados — atualização atual

O menu agora possui **Assuntos**. A tela reúne contexto, responsável, próximos passos, acompanhamento, histórico e várias decisões vinculadas. A Agenda permanece unificada.

- Crie um assunto e, dentro do cartão, use **Registrar decisão**. O formulário já vem vinculado ao assunto.
- Cada decisão mantém alternativas, escolha tomada, data/hora, revisão, histórico e alertas próprios.
- Marque **Há uma decisão pendente? → Sim** no assunto para sinalizar Precisa decidir. Esse estado é controlado por você: registrar uma decisão não resolve o assunto automaticamente nem elimina outras decisões pendentes.
- A busca inclui o assunto e suas decisões/históricos. O filtro Revisar agora também considera revisões de decisões vinculadas.
- Decisões antigas sem assunto aparecem em **Assuntos com decisão · a organizar**. Edite para escolher um assunto existente ou use **Criar assunto com esta decisão**, que abre um formulário para confirmar o novo contexto. O registro original e seu histórico são preservados.
- Excluir um assunto não exclui suas decisões. Elas reaparecem sem vínculo para você organizar depois. A confirmação avisa esse comportamento.

A estrutura JSON continua compatível: `topics` e `decisions` são preservados; `topicId` opcional liga cada decisão ao assunto. Não há cópia, fusão ou migração destrutiva ao abrir o arquivo. O campo opcional `decisionState` sinaliza a pendência no assunto.

Extraia em pasta nova, execute iniciar.sh/iniciar.bat e recarregue Ctrl+Shift+R. O menu deve indicar **Agenda e assuntos unificados**. HTML, CSS e JavaScript continuam separados. Abra seu JSON atual normalmente.

As descrições de telas separadas nas notas de versões anteriores abaixo são históricas e foram substituídas por esta organização.

---

# Agenda unificada — atualização atual

Há somente **Agenda** no menu. Ela reúne compromissos importados, blocos recorrentes, prazos de tarefas e revisões de assuntos/decisões. A antiga tela Minha rotina foi incorporada; não é necessário migrar seu JSON.

- Use **Dia / Semana / Mês**, as setas e Hoje para navegar.
- Filtre por tipo: compromissos importados, blocos recorrentes, tarefas, revisões de assuntos ou decisões. O filtro de calendário restringe somente os eventos importados.
- **Criar bloco recorrente** define título, dia da semana, hora e observação. O bloco repete toda semana; editar/excluir afeta todas as ocorrências.
- Selecione uma data para consultar detalhes, editar os blocos ou criar tarefa/bloco para aquele dia da semana.
- Os alertas permanecem centralizados no botão Alertas. Filtros de visualização não desativam notificações. Ao abrir um alerta, a agenda limpa os filtros para mostrar o item.
- A importação ICS e as sugestões de blocos recorrentes continuam disponíveis abaixo do calendário.

Extraia este ZIP em uma pasta nova e execute iniciar.sh/iniciar.bat. Recarregue com Ctrl+Shift+R; o menu deve indicar **Agenda unificada**. Use seu JSON atual normalmente. Este projeto mantém HTML, CSS e JavaScript separados.

As referências antigas a Minha rotina nas notas das versões anteriores abaixo passam a significar os blocos recorrentes dentro de Agenda.

---

# Atualização — campos Data e hora

Extraia este ZIP em uma pasta nova. Inicie o aplicativo pelo iniciar.sh/iniciar.bat dessa pasta. Recarregue com Ctrl+Shift+R. No rodapé do menu deve aparecer **Versão 20/10 · Data e hora 2**.

Ao criar/editar tarefa, o bloco azul **Prazo da tarefa · data e hora** aparece logo após o título, com campos separados Data e Hora. Assuntos têm **Próximo acompanhamento · data e hora**; decisões têm **Próxima revisão · data e hora**.

O HTML e os módulos usam URLs versionadas para evitar reaproveitamento de código anterior. Os dados continuam no seu JSON habitual: abra o mesmo arquivo normalmente.

---

# Techlead Desk

Aplicação pessoal em HTML, CSS e JavaScript puro. Sem framework, build, pacotes de execução, telemetria ou backend de aplicação. O painel só abre depois que um arquivo JSON real for criado ou aberto com permissão de escrita.

## Executar

1. Extraia o ZIP em uma pasta.
2. Abra um terminal nessa pasta (onde está `index.html`).
3. Com Python 3 já disponível, execute:

   ```sh
   python3 -m http.server 8080 --bind 127.0.0.1
   ```

   No Windows, use `py -3 -m http.server 8080 --bind 127.0.0.1`.
4. No **Chrome ou Edge**, abra **http://localhost:8080**.
5. Clique em **Criar arquivo novo**, escolha onde salvar `techlead-desk.json` e confirme o seletor. Ou escolha **Abrir arquivo existente** e conceda leitura/escrita.
6. Ao terminar, confirme o estado salvo antes de fechar. Para voltar, abra novamente o aplicativo e selecione o mesmo JSON.

Há também `iniciar.sh` e `iniciar.bat` como atalhos para iniciar o servidor estático. Python serve apenas os arquivos da interface; não recebe nem grava seus dados. Qualquer servidor estático em localhost ou hospedagem HTTPS também pode servir esta pasta. Não abra o HTML por duplo clique: módulos JavaScript precisam de um servidor estático. Não precisa de `npm install`.

## Recursos

- Visão geral com indicadores, ações por prazo/prioridade e assuntos para acompanhar.
- Tarefas com responsável, projeto, prazo, prioridade, status, edição, busca, filtros e exclusão confirmada.
- Anexos pelo seletor ou arraste/solte; imagens com miniatura e modal; download de qualquer anexo válido.
- Assuntos com próximo passo, data de revisão, pessoa aguardada e histórico.
- Decisões com contexto, alternativas, responsável e revisão opcional.
- Minha rotina com calendário semanal e mensal, sugestões opcionais e blocos editáveis. A visualização mensal mostra a repetição dos blocos semanais em datas reais.
- Agenda diária, semanal e mensal com eventos ICS, tarefas com prazo, rotinas e destaque de sobreposições entre compromissos importados. Selecione um dia para ver horários completos, origens e tarefas em grupos separados. Rotinas não têm duração definida e não geram conflitos estimados.
- Notas com gravação automática e conversão explícita em tarefa, preservando a nota.
- Layout adaptável, diálogos nativos acessíveis, foco visível e atalhos Ctrl/Cmd+S.

## Arquivo e gravação

`core.js` concentra validação e `FileStore`; `calendar.js` analisa ICS; `planner.js` calcula períodos e organiza itens por dia; `app.js` cuida da interface e estado da sessão. O JSON tem `schemaVersion: 1`, `updatedAt`, `tasks`, `topics`, `decisions`, `routines`, `notes`, `calendarEvents`, `calendarImports` e `settings`.

O estado inicial é `null`: nenhum painel utilizável existe antes do seletor. `showOpenFilePicker` lê o JSON do identificador escolhido e solicita leitura/escrita. `showSaveFilePicker` cria o esquema inicial e aguarda `write()` e `close()` antes de liberar o painel. Cada alteração modifica o estado em memória e escreve nesse mesmo identificador. Não há cópia persistente no navegador.

As escritas são serializadas. Um contador de revisões faz o escritor continuar até incluir a alteração mais recente. “Salvo” só aparece após `close()` resolver. Se a gravação falhar, os dados continuam na memória, o aviso permanece e **Salvar agora** tenta novamente. Navegação interna aguarda anexos em leitura e gravações; falha de gravação pausa a navegação. O aviso de saída depende do suporte do navegador a `beforeunload`; não impede encerramento forçado do processo.

O identificador fica somente em memória. Reabrir a página exige selecionar o arquivo novamente. JSON inválido ou versão incompatível bloqueiam o painel e não são sobrescritos. Campos desconhecidos são preservados. Não edite o mesmo JSON em duas abas ou aplicativos simultaneamente: o projeto serializa sua própria sessão, mas não implementa bloqueio entre processos.

## Anexos

Cada anexo armazena `id`, `name`, `mimeType`, `size`, `addedAt` e **`dataBase64` com Base64 puro**, sem prefixo de Data URL. O aplicativo valida estrutura, MIME, Base64 e tamanho reconstruído. Anexos inválidos são mantidos no JSON e sinalizados como indisponíveis.

Limites padrão: 10 MiB por arquivo e 25 MiB por tarefa, configuráveis em Tarefas (máximo 100 MiB). A validação acontece antes de iniciar a leitura de anexos novos. Base64 amplia o conteúdo em cerca de 33%; cada alteração reescreve o JSON inteiro. Prefira arquivos pequenos para manter a interface ágil.

A lista segura de prévia inclui PNG, JPEG, GIF, WebP, AVIF e BMP. SVG, HTML e outros formatos ficam disponíveis apenas para download. Nenhum conteúdo de anexo é executado. O Blob temporário de exportação usa MIME validado e sua URL é revogada após o download. Remoção exige confirmação.

## Calendário Microsoft Teams / Outlook

**Esta entrega usa o fluxo local `.ics`. Não há integração Microsoft Graph/OAuth configurada.** Nenhuma senha, token ou credencial é solicitada ou persistida. O aplicativo não envia chamadas de rede e nunca altera o calendário remoto.

Na aba Agenda, expanda a seção de importação, escolha nome estável de origem, intervalo de até 366 dias e um ICS de até 20 MiB. Use o mesmo nome da origem nas atualizações. A chave `source + sourceEventId` identifica UID e ocorrência. Eventos ausentes em uma atualização do intervalo são marcados indisponíveis, preservados na agenda e no JSON. Cancelamentos explícitos também são preservados. Tarefas, rotinas e outras origens não são apagadas.

Como obter o ICS: no Outlook clássico, Arquivo → Salvar calendário, escolhendo o intervalo. No Outlook na Web, procure Configurações → Calendário → Calendários compartilhados → Publicar um calendário. Essa opção depende da organização e pode tornar o link público; só use se permitido. Salve o conteúdo do link ICS em um arquivo para importar. O calendário deve ser da mesma conta utilizada no Teams. Não há sincronização automática: a ação é **Importar / atualizar**.

Suporte: eventos únicos; datas de dia inteiro; UTC, horários locais flutuantes e fusos IANA reconhecidos pelo navegador; recorrências DAILY, WEEKLY, MONTHLY e YEARLY com INTERVAL, COUNT e UNTIL; BYDAY simples em WEEKLY; BYMONTHDAY positivo único em MONTHLY; WKST; RDATE simples, EXDATE e alterações de ocorrência por RECURRENCE-ID. Eventos temporizados precisam de DTEND ou DURATION. Fusos flutuantes usam o fuso local do computador. O identificador de fuso IANA é usado em vez de interpretar regras VTIMEZONE personalizadas.

**Limitação explícita:** este não é um motor completo de RFC 5545. Regras avançadas (por exemplo BYSETPOS, dias ordinais, RDATE em períodos, RANGE=THISANDFUTURE e fusos Windows/personalizados) não podem ser representadas com segurança; exporte ocorrências individuais em UTC. Regras reconhecidamente não suportadas são recusadas e não alteram os dados locais. Não presuma que qualquer ICS arbitrário terá suporte: confira os eventos importados.

## Testes

Com Node.js 20+ já disponível, sem instalar pacotes:

```sh
node --test tests/*.test.js
```

Consulte `TESTES.md` para resultados, cobertura e roteiro de conferência no navegador. Os testes não fazem parte da execução normal do aplicativo.

## Navegação simplificada — atualização

Em **Minha rotina**, use **Semana / Mês** para alternar a visualização. As setas avançam ou voltam um período; **Hoje** retorna à data atual. Selecionar um dia abre os detalhes. Criar um bloco por esse painel já seleciona o dia da semana. Os blocos continuam recorrentes: editar ou excluir altera todas as ocorrências da rotina.

Em **Agenda & prioridades**, escolha **Dia / Semana / Mês**. Compromissos, rotinas e prazos de tarefas têm identificação visual e legenda. No painel do dia, **Horários** e **Tarefas com prazo** aparecem separados; ali você pode abrir a reunião, revisar uma tarefa ou concluí-la. Itens com sobreposição recebem aviso. Eventos de vários dias aparecem em cada data correspondente. As visualizações não geram cópias nem mudam os dados.

Abaixo do calendário, **Precisa de atenção** reúne tarefas atrasadas e sem prazo. A importação ICS e suas instruções ficam numa seção recolhida, liberando espaço para enxergar a agenda. Não é necessário converter o JSON existente: basta abri-lo na versão atualizada.

## Visão geral e listas orientadas à ação

- **Visão geral:** resumo de foco, contadores clicáveis, até três sugestões de tarefas, retornos aguardados, horários reais do dia e indicadores gerais. A ordenação sugerida considera atraso, vencimento hoje, prioridade alta e próximos prazos; não muda a prioridade salva.
- **Tarefas:** grupos separados para atrasadas, hoje, alta prioridade, próximos prazos, sem prazo e concluídas. Cada cartão exibe prioridade, prazo, projeto, responsável e próximo passo. As concluídas ficam recolhidas na visão geral da lista; é possível expandir ou filtrar. Anexos ficam dentro do cartão, numa seção expansível.
- **Assuntos paralelos:** revisões vencidas ou para hoje vêm primeiro. Cartões destacam status, pessoa envolvida, próximo passo e histórico. Visões rápidas de aguardando e andamento também incluem assuntos cuja revisão já venceu.
- **Decisões:** a escolha tomada fica em destaque; contexto e alternativas ficam disponíveis ao expandir. Revisões vencidas ou para hoje aparecem antes do histórico. Uma revisão atrasada é um lembrete, não uma invalidação automática da decisão.

Cores têm legendas textuais nos próprios componentes: vermelho indica atraso, amarelo indica hoje/espera, violeta destaca prioridade alta/acompanhamento, azul identifica andamento ou agendamento e verde identifica conclusão. Busca, filtros e botão Limpar filtros ajudam a reduzir a lista. Todos os números vêm do JSON aberto; não há dados demonstrativos na aplicação.

## Notas & ideias

O rascunho continua com gravação automática. Use **Guardar como ideia** para abrir um formulário preenchido com o texto, ajustar o título e confirmar. **Nova ideia** permite registrar diretamente. A lista **Minhas ideias** oferece busca, edição e exclusão com confirmação. Ideias não entram nos indicadores de tarefas nem ganham prazo automaticamente.

Cada ideia tem `id`, `title`, `content`, `createdAt` e `updatedAt`, na coleção opcional `ideas` do mesmo JSON. Arquivos antigos sem essa coleção continuam válidos; o rascunho anterior é preservado.

**Transformar em tarefa** abre o formulário de tarefa e só cria o registro após confirmar. A ideia é preservada; a tarefa recebe `sourceIdeaId`. A lista passa a oferecer **Ver tarefa** para evitar criação repetida. Se a tarefa for excluída, a ideia pode gerar outra. Excluir uma ideia não exclui sua tarefa. O texto do rascunho também é mantido ao gerar ideias ou tarefas e só é apagado ao confirmar Limpar rascunho.

## Marca embutida

A marca combina um monograma TD em azul-marinho com azul-claro e um ponto verde. Foi aplicada na abertura, menu lateral e favicon. O símbolo é um SVG vetorial embutido em Data URL Base64 no próprio `index.html`, sem arquivo de imagem adicional nem dependência de rede.

## Históricos de assuntos em Notas & ideias

Além de ideias, você pode guardar um histórico por assunto: título, contexto inicial e atualizações datadas. No rascunho, escolha **Guardar como histórico**, ou use **Novo registro** e selecione o tipo. Cada registro oferece **Registrar atualização**, que acrescenta uma entrada sem substituir as anteriores.

A busca pesquisa título, contexto e todas as atualizações, e abre o histórico dos registros encontrados. Use o filtro para ver todos, ideias ou históricos de assuntos. Nada vira tarefa automaticamente. Ao transformar em tarefa, o contexto e o histórico atual são copiados para a descrição; o registro original continua disponível. Excluir um registro exige confirmação e não exclui a tarefa vinculada.

Os campos opcionais `recordType` (`idea` ou `history`) e `history` (entradas com `id`, `at`, `text`) ficam em cada item de `ideas` no mesmo JSON. Ideias antigas continuam válidas sem esses campos.

Esta entrega mantém a estrutura original do projeto em arquivos separados. Execute pelos atalhos iniciar.sh/iniciar.bat ou conforme as instruções anteriores.

## Alertas da rotina e da agenda

Após abrir seu JSON, clique em **Alertas** no cabeçalho, ou **Configurar alertas** em Minha rotina / Agenda & prioridades.

1. Marque **Ativar alertas** e escolha 5, 10, 15, 30 ou 60 minutos de antecedência (padrão: 10).
2. Escolha as fontes: rotina, compromissos importados ou ambas.
3. Marque som e/ou notificações do navegador. Clique em **Permitir notificações** para solicitar autorização oficialmente ao navegador. O aplicativo não pede essa permissão sozinho.
4. Clique em **Testar som** e ajuste o volume do sistema. Salve as preferências.

Cada ocorrência gera um aviso antes e outro ao começar. O cartão visual aparece em qualquer tela, indica o horário e a origem e oferece Ver na agenda ou Dispensar. O painel Alertas guarda os últimos 100 avisos desta sessão. O indicador do cabeçalho mostra os avisos não lidos. Alertas de início substituem o cartão anterior da mesma ocorrência. A rotina é identificada por bloco e data: não recebe cópias do calendário a cada semana.

Preferências ficam em `settings.reminders` no JSON; histórico de avisos e controle de repetição ficam somente em memória. A lógica está em `reminders.js`; a interface, som Web Audio e Notification API estão em `app.js`. Nenhum serviço remoto, armazenamento no navegador ou service worker foi adicionado.

**Limites reais:** mantenha o sistema aberto e o JSON carregado. Não há alertas com a página fechada. Verificações ocorrem a cada cinco segundos e ao voltar à aba/janela, mas o navegador e o sistema operacional podem suspender abas e bloquear som/notificações. A página recupera avisos de início com atraso de até dez minutos; depois disso não reproduz compromissos antigos. Ao reabrir a página, as preferências são recuperadas do JSON, mas pode ser necessário clicar em Testar som para liberar áudio novamente. Não há deduplicação entre duas abas abertas com o mesmo arquivo; use uma sessão.

Eventos de dia inteiro, cancelados, já terminados ou indisponíveis na origem não geram avisos. Rotinas têm somente horário inicial: há aviso antes e no início, sem duração inventada nem alerta de término. Itens com apenas uma data continuam visíveis na agenda, sem alerta por horário até você preencher uma hora. O botão Ver na agenda abre o dia correspondente. Alterações na agenda remota só chegam após atualizar o ICS.

## Linha do tempo em tarefas, assuntos e decisões

Cada cartão de Tarefas, Assuntos paralelos e Decisões agora inclui **Histórico de atualizações**, com entradas em ordem cronológica, data e hora. Use **Registrar atualização** para acrescentar contexto ou registrar uma conversa sem substituir o texto principal. A busca dessas listas também inclui as atualizações.

Os registros existentes são preservados, incluindo entradas antigas de assuntos sem identificador. Tarefas e decisões antigas sem `history` continuam válidas. Novas entradas usam `{id, at, text}` no array `history` do próprio item, salvo no mesmo JSON.

A partir desta versão, criação e edições desses três tipos também geram histórico. Edições registram os campos alterados com valor anterior e novo, sem gerar entrada quando nada mudou. Nas tarefas, concluir/reabrir e adicionar/remover anexos também geram entrada. Nos assuntos, resolver/reabrir mantém o registro de status. Alterações anteriores à atualização do aplicativo não são reconstruídas nem inventadas. As entradas não possuem exclusão individual; excluir o item inteiro também exclui seu histórico, após confirmação.

## Data e hora em tarefas, assuntos e decisões

- Tarefas: **Data do prazo** e **Hora do prazo** (`dueTime`).
- Assuntos paralelos: **Revisar em** e **Hora de acompanhar** (`reviewTime`).
- Decisões: **Data/Hora da decisão** (`dateTime`, registro histórico) e **Data/Hora da revisão** (`reviewTime`, usado no alerta).

Os horários são opcionais, em HH:MM, e exigem a data correspondente. Arquivos antigos permanecem válidos: não recebem horários inventados. Datas e horas são interpretadas no fuso local do computador.

Na Agenda & prioridades, tarefas e revisões aparecem no dia correspondente, com horário explícito e identificação do tipo, inclusive no mês/semana/dia. No painel lateral ficam em Tarefas e revisões. Os itens com hora são ordenados cronologicamente junto dos compromissos; os sem hora ficam depois. Esses marcos não possuem duração presumida e não viram reuniões no calendário remoto. A hora da decisão é apenas a informação de quando ela foi tomada; a revisão é o marco que aparece na agenda.

Em Alertas, a opção **Tarefas e revisões com horário** controla as três fontes. Com alertas ativados, há aviso antes e no horário do prazo ou revisão, respeitando a antecedência configurada. As mensagens distinguem prazo de tarefa e revisão. Tarefas concluídas e assuntos resolvidos não geram alertas. A revisão da decisão continua ativa até você alterar/remover sua data/hora. Limitações de aba aberta, áudio, permissão e suspensão do navegador continuam aplicáveis.

