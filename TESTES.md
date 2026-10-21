# Verificação — 20/10/2026

**73 testes automatizados passaram, sem dependências externas.**

Comando: `node --test tests/*.test.js` (Node 24.19.0 neste ambiente).

Os testes de persistência usam o mesmo `FileStore` da aplicação com um adaptador de arquivo real do Node: `write()` escreve em arquivo temporário no disco e `close()` substitui o JSON selecionado. Cada operação é verificada por leitura independente dos bytes em disco. Isso demonstra a lógica real de origem/destino e serialização, mas não equivale a testar os seletores e permissões nativos do Chrome.

Os testes de inicialização usam um DOM mínimo simulado. Eles executam `app.js`, mas não verificam layout, árvore de acessibilidade ou renderização gráfica.

| Cenário pedido | Resultado e evidência |
|---|---|
| 1. Painel bloqueado sem arquivo | Passou no harness: `hidden` e `inert` permanecem ativos. |
| 2. Cancelamento do seletor | Passou no harness com AbortError; painel segue bloqueado. |
| 3. Criação de arquivo inicial | Passou com arquivo real no disco e no harness; esquema validado. |
| 4. Reabrir e recuperar dados | Passou com nova instância de FileStore lendo o mesmo JSON real. Reabertura da aba ainda exige conferência manual. |
| 5. Criar/editar/excluir tarefa | Passou; JSON real lido após cada gravação. |
| 6. Imagem em Base64/miniatura/prévia | Base64 e controles de imagem passaram no harness. Aparência e abertura visual do modal não foram verificadas em navegador. |
| 7. Anexo binário reconstruído | Passou: bytes recuperados do JSON idênticos aos originais. Clique de download no navegador não executado. |
| 8. Remoção, limites, MIME, leitura | Remoção persistida em disco; arquivos vazios, excedentes, MIME inválido e erro de leitura passaram no harness, preservando o anexo existente. Confirmação visual não executada. |
| 9. Alterações rápidas | Passou: 60 mutações concorrentes; no máximo um escritor ativo; todas no JSON final. |
| 10. JSON inválido | Passou: falha ao abrir, sem desbloqueio e sem sobrescrita. |
| 11. Falha de escrita/permissão | Passou: falhas em createWritable, write e close não indicam sucesso; estado continua pendente e retry grava corretamente. |
| 12. Sem persistência no navegador | Passou: varredura do código de produção sem APIs de armazenamento, cookies, cache ou service workers. |
| 13. Navegador/contexto incompatível | Passou no harness; ações desabilitadas e instrução clara. |
| 14. ICS preserva dados locais | Passou: tarefas e rotinas intactas; eventos importados separadamente. |
| 15. Sincronização sem duplicatas | Passou: segunda importação mantém a contagem; ausentes marcados indisponíveis. |
| 16. Conflitos preservados | Passou: ambos os eventos permanecem e detecção de sobreposição retorna verdadeiro. Disposição visual ainda não conferida. |
| 17. Somente leitura / sem tokens | Passou: código sem chamadas de rede ou OAuth e sem tokens gerados. |

Testes adicionais cobrem campos desconhecidos preservados, tipos e datas inválidos, anexos malformados, recorrência semanal, exceções, cancelamentos, fuso America/Sao_Paulo e duração de dia inteiro durante mudança de horário de verão em America/New_York.

## Limitação do ambiente

Não há Chromium instalado no ambiente de geração. A tentativa de obter o navegador de teste falhou por download inválido. Portanto, não houve teste visual nem teste ponta a ponta com seletores nativos, e não se afirma que todos os 17 cenários foram verificados em navegador real.

## Conferência manual no seu Chrome / Edge

1. Inicie o servidor conforme README. Abra localhost; tente usar Tab antes de escolher arquivo e confirme que o painel está inacessível.
2. Cancele Abrir. Em seguida, crie um JSON numa pasta temporária.
3. Cadastre uma tarefa. Aguarde “Salvo” e confira seu título no JSON usando um editor de texto. Não altere o arquivo nesse editor enquanto o aplicativo estiver aberto.
4. Anexe um PNG real. Confira `dataBase64` no JSON, a miniatura e sua ampliação. Anexe também um PDF e baixe-o; compare seu conteúdo com o original.
5. Edite/conclua/exclua a tarefa; confira o JSON. Teste remoção de anexo, confirmações e cancelamentos dos diálogos.
6. Escreva rapidamente em Notas, aguarde salvar, recarregue a página e abra o mesmo JSON; confira o texto.
7. Abra um JSON inválido numa nova sessão e confirme o bloqueio. Teste também num navegador sem suporte.
8. Importe um ICS real com eventos sobrepostos, duas vezes, usando a mesma origem. Confira contagem, datas locais, lado a lado e tarefas preservadas. Importe arquivo atualizado sem um evento e confira a marca de indisponível.
9. Confira navegação por teclado, modal de imagem, menu em tela estreita e mensagens de permissão do seu navegador.
10. Para simular erro de escrita, use uma cópia temporária: revogue o acesso ao arquivo no navegador ou torne o diretório indisponível. Faça uma alteração e confirme erro visível e nova tentativa. Mover/remover um arquivo pode manter o handle válido em alguns sistemas; por isso não garante reproduzir uma falha.

## Atualização dos calendários semanal e mensal

Sete testes adicionais passaram: limites da semana com início na segunda; grade mensal completa na virada do ano; navegação de fim de mês e ano bissexto; repetição da rotina nas datas reais sem gravar cópias; distinção de eventos/rotinas/tarefas e preservação de conflitos; eventos em múltiplos dias com fim exclusivo; renderização das opções Semana/Mês em ambas as telas sem alterar o arquivo salvo.

Conferência visual manual ainda pendente: testar alternância Semana/Mês, setas, Hoje, seleção de dia, painel de detalhes, tarefas vencidas, filtro de origem e rolagem no celular. Essa atualização não foi inspecionada em navegador real neste ambiente.

## Atualização da visão geral e das listas

Seis testes adicionais passaram: classificação de tarefas concluídas e prioridade de prazo; ordenação sugerida sem mutação; assuntos resolvidos fora dos alertas de revisão; revisão de decisões baseada na data correta; renderização das quatro telas com dados reais do estado, conteúdo escapado e agrupamentos sem alterar o arquivo; filtros de prioridade alta e aguardando incluindo itens já atrasados.

A verificação automatizada de componentes usa o harness de DOM, sem navegador gráfico. Permanecem pendentes as conferências visuais de contraste, espaçamento, filtros clicáveis, cartões em celular, expansão dos anexos e foco de teclado nas quatro telas redesenhadas.

## Atualização Notas & ideias

Quatro testes adicionais passaram: compatibilidade com arquivos sem a coleção `ideas`; rejeição de tipos, títulos e identificadores inválidos; gravação, reabertura, edição e exclusão de ideias em disco sem apagar tarefas vinculadas ou rascunho; fluxo no harness de listagem e criação de tarefa a partir da ideia apenas ao confirmar o formulário, mantendo ideia e rascunho e exibindo o vínculo.

Continua pendente a inspeção visual em navegador real, incluindo formulário de ideia, busca e confirmação de exclusão.

## Identidade visual

Verificação estrutural: as três aplicações da logo usam a mesma Data URL Base64; conteúdo decodificado validado como XML SVG; nenhum arquivo de imagem novo adicionado. A inspeção visual em navegador permanece pendente.

## Históricos de assuntos — projeto em arquivos separados

Três testes adicionais passaram: gravação e reabertura em disco preservando contexto e atualizações anteriores; validação de tipos, datas e IDs do histórico; fluxo de acrescentar atualização e pesquisar termos que existem apenas dentro do histórico, sem criar tarefas automaticamente.

O teste de interface usa o DOM simulado. Inspeção visual e seletores nativos em navegador real continuam pendentes.

## Alertas com som, navegador e aviso visual

Sete testes novos passaram: aviso antecipado e de início sem repetição; compromissos simultâneos e exclusão de cancelados/dia inteiro/indisponíveis/terminados; rotina com antecedência atravessando meia-noite; controles de ativação/fontes e validação das preferências; recuperação de início atrasado sem replay antigo; reimportação sem duplicar e identidade de compromisso reagendado; integração simulada de cartão visual e Notification API, respeitando permissão negada e sem solicitá-la automaticamente.

Comando: `node --test tests/*.test.js`. Resultado: 54 testes aprovados. Temporizadores e Notification API são simulados no teste de interface. O som real, permissões nativas, entrega pelo sistema operacional e aparência dos alertas ainda exigem conferência no Chrome/Edge do usuário.

Roteiro manual: ative os alertas; permita notificações; teste o som; crie um bloco de rotina para alguns minutos adiante; confirme o cartão antecipado e o de início em outra tela; dispense e confira o histórico. Teste também com permissão negada, som desmarcado e ao retornar à aba. As políticas do navegador podem afetar o áudio e temporizadores.

## Históricos em tarefas, assuntos e decisões

Quatro testes adicionais passaram: atualização manual nas três coleções, mantendo entradas antigas dos assuntos e pesquisa no conteúdo; edição com valores anteriores e novos, sem duplicar entrada em salvamento sem mudanças; gravação e reabertura em disco das três linhas do tempo; validação de históricos malformados e compatibilidade com tarefas antigas sem histórico.

Total atual: 58 testes aprovados (`node --test tests/*.test.js`). O fluxo de interface usa DOM simulado; a inspeção visual em navegador permanece pendente.

## Horários e alertas de trabalho

Quatro testes adicionais passaram: avisos antes e no horário de tarefas/assuntos/decisões, excluindo itens concluídos/resolvidos e sem hora; ordem dos marcos de trabalho na agenda e preservação dos sem hora; validação HH:MM/data correspondente e compatibilidade com registros antigos; identificação de tarefa atrasada quando a hora de hoje passou. Total atual: 62 testes aprovados.

Pendente no navegador real: conferir os campos de hora dos três formulários, cartões em todos os modos da agenda e aviso real de prazo/revisão com som e notificação autorizada.

## Verificação dos campos visíveis de hora

Teste adicional executa openEditor em tarefas, assuntos e decisões, confirma inputs type=time nos três formulários e a gravação dos horários preenchidos no JSON. Total atual: 63 testes aprovados. Conferência visual em navegador real ainda pendente.

## Unificação de rotina e agenda

O teste anterior de duas telas foi atualizado para confirmar uma única navegação Agenda, os três modos de período e o acesso à criação de blocos recorrentes. Um teste adicional verifica o filtro por tipo mantendo os dados existentes e suas identidades. Total: 64 testes aprovados. Alertas continuam independentes do filtro visual. Inspeção visual no navegador ainda pendente.

## Assuntos com decisões vinculadas

Três testes adicionais passaram: tela/navegação única exibindo múltiplas decisões vinculadas e registros antigos, com busca no contexto da decisão; criação confirmada de assunto a partir de decisão preservando ID/histórico e desvinculação sem excluir; registro de várias decisões no mesmo assunto mantendo o status original. Total: 67 testes aprovados. Alertas e agenda continuam lendo os registros originais sem duplicação. Inspeção visual no navegador permanece pendente.

## Assuntos simplificados

O teste novo confirma lista única, próximo passo visível, ação de atualização e decisões dentro do assunto, sem painel de métricas ou botão global de decisão. Verificações anteriores foram atualizadas para a nova apresentação, mantendo preservação de históricos, múltiplas decisões e busca vinculada. Total: 68 testes aprovados. Inspeção visual em navegador real continua pendente.

## Remoção de decisões como recurso

Testes obsoletos de criação/vínculo de decisões foram substituídos por verificação da conversão de arquivos antigos. Testes de agenda e alertas agora passam pelo conversor, mantendo acompanhamentos como assuntos.

Total atual: 68 testes aprovados. Foram verificados: conversão única preservando conteúdo completo e campos desconhecidos; histórico anterior do assunto; múltiplos acompanhamentos com horários diferentes sem alertas duplicados de decisão; abertura de arquivo antigo, conversão e gravação no mesmo JSON; ausência de controles de decisão na interface. A inspeção visual no navegador permanece pendente.

## Tela de tarefas simplificada

Teste adicional confirma lista única expansível, prazo com hora, descrição/histórico/anexos preservados e visões Em aberto/Concluídas/Todas, sem painel de métricas ou agrupamentos e sem modificar dados ao alternar. O teste de atraso foi ajustado ao rótulo por tarefa, Atrasada. Total atual: 69 testes aprovados. Inspeção visual e interação nativa com o checkbox no navegador ainda pendentes.

## Apresentação dos cartões de tarefas

Os mesmos 69 testes passaram após a mudança de apresentação. A estrutura mantém inputs de conclusão, ações de edição/atualização, prazo com hora, anexos e histórico. Esta mudança é visual e não altera o esquema JSON. Sem inspeção em navegador real neste ambiente.

## Botões, três estados e associação tarefa/assunto

Quatro testes adicionais passaram: gravação/reabertura em disco de status em andamento e vínculo; botões explícitos sem checkbox e transições aberto → andamento → concluído → aberto, com histórico e sem alterar o assunto; links nos dois sentidos e transferência/desvinculação preservando dados; criação a partir de um assunto e associação de tarefa existente sem duplicar registros.

Total atual: 73 testes aprovados. A interface é executada em DOM simulado; inspeção visual e cliques nativos no navegador ainda pendentes.

## Base unificada (1.3.0)

`npm test`: validação, persistência e regras de negócio compartilhadas.

`npm run build:web` e `npm run test:web`: teste Playwright no Chromium tanto via HTTP quanto no HTML único em `file://`. Verifica splash, criação de tarefa, conteúdo do JSON, cabeçalho fixo, prévia de alerta com posição e duração, cancelamento de troca de arquivo, reabertura e navegação no topo. Somente o seletor nativo é substituído por um adaptador em memória; os testes de persistência unitários usam disco real. `npx playwright install chromium` instala o navegador de teste.

`npm run test:electron`: aplicação Electron real com IPC, seletores substituídos para automação, arquivo real em disco, backup, janela de alerta, geometria, duração e preferências.

Em hosts sem Chromium de teste, `TECHLEAD_WEB_ELECTRON=1 npm run test:web` usa uma janela Chromium do Electron sem preload ou ponte nativa. A CI usa o Chromium independente para a validação web.
