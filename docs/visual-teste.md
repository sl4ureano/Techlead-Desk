# Home recomposta — teste, revisão 2

A primeira revisão manteve a composição anterior. Esta versão reconstrói a home com base na referência Taskdly destacada pelo usuário.

## Composição

- Janela branca arredondada sobre fundo cinza, com navegação estreita e seleção escura.
- Centro em duas colunas: ilustração editorial e calendário mensal; abaixo, resumo de tarefas e próximos passos compactos.
- Coluna direita independente para acompanhamentos de assuntos e horários do dia.
- Sem banner de foco ou sequência de cartões de métricas na home.
- Cores pastel pontuais, bastante espaço negativo e divisórias discretas.

## Dados e ações

O calendário usa o mês atual e marca os dias com compromissos. Clicar em um dia abre a agenda correspondente. Os próximos passos abrem as tarefas existentes. Os acompanhamentos mostram assuntos reais em estado aguardando; não há chat fictício ou envio de mensagens. O resumo circular conta tarefas concluídas, em andamento e abertas do arquivo atual. As telas vazias preservam a estrutura sem inventar dados.

A ilustração é um SVG local embutido. Não foram adicionadas dependências externas ou fontes remotas. O JSON continua compatível com a versão original.

## Validação

- `npm test`: 100 testes passaram, com expectativas atualizadas para a nova composição.
- `npm run build:web`: HTML único regenerado com os mesmos recursos.
- `npm run test:web`: passou em HTTP e HTML único file://.
- Conferência adicional em Chromium headless: sete áreas em 1440 × 1100, navegação e modal em 390 × 844, atalhos do calendário e de tarefas; sem erros de JavaScript ou transbordamento lateral nas páginas verificadas.

O aplicativo Electron nativo não foi executado nesta revisão.

## Abrir

Para usar o arquivo único, abra `dist/techlead-desk-unico.html` no Chrome ou Edge. Para executar a versão modular, siga as instruções do README. Não há dados pessoais ou arquivo JSON de demonstração no pacote.

## Revisão 3 — rolagem e paleta

A rolagem fica dentro da área de trabalho, preservando a janela arredondada, o cabeçalho e o menu. Navegar para outra tela volta o conteúdo ao topo. A base azul e azul-marinho original foi restaurada. Validado em navegador com rolagem real a 1200 × 700: menu e cabeçalho mantêm a posição; navegação retorna ao topo. Os 100 testes e o teste web em módulos e HTML único passaram.

## Revisão 4 — auditoria completa de cores

Substituídos os tons roxos nos estilos globais e do tema, incluindo fundos, bordas, abas, indicadores e textos secundários. Splash web e splash nativo usam fundo azul-marinho e acentos azuis. Mantidas as cores semânticas de alerta, prioridade e conclusão. Auditoria de cores CSS sem tons roxos remanescentes; 100 testes e verificações web passaram.

## Revisão 5 — home e agenda interativa

Home ajustada para caber sem rolagem nas resoluções verificadas de 1654×900, 1366×768 e 1280×720. Horários da home e itens do calendário abrem o registro correspondente. Compromissos importados abrem um modal de consulta. Em cada dia da agenda semanal/diária, + Horário oferece intervalos de meia hora com data e hora preenchidas para uma tarefa; o formulário permite ajustar os minutos. Clicar numa área vazia do dia cria uma tarefa nessa data. 101 testes passaram; verificados no navegador clique, criação em outro dia às 14:30, gravação e reabertura, além dos detalhes de evento importado.

## Revisão 6 — seleção do dia e contexto das tarefas

Clicar no calendário da home mantém a Visão geral e filtra tarefas, acompanhamentos e horários pelo dia. Voltar ao resumo geral limpa a seleção. Novos registros iniciados com um dia selecionado recebem essa data. As tarefas exibem prazo, hora, prioridade e situação em tempo real. 102 testes passaram, com verificações de seleção local, filtros e metadados; testes web em módulos e HTML único também passaram.

## Revisão 7 — legibilidade, ações na home e foco na tarefa

Textos secundários aumentados para pelo menos 12 px nas folhas de estilo da interface, títulos de itens para 14 px e títulos de seções para 16 px. Cores de texto secundário ganharam contraste. O menu de tarefas da home reutiliza o mesmo componente da lista (iniciar, concluir/reabrir, atualizar, editar e excluir); assuntos têm atualizar/editar/encerrar/excluir; eventos importados mantêm consulta. Clicar em Comece por aqui filtra a lista pelo ID exato, abre o histórico e oferece Ver todas as tarefas. Selecionar uma aba de status ou limpar filtros também remove o foco individual. 103 testes passaram, com verificação adicional no navegador do filtro único, retorno à lista e atualização/início pela home. Home sem rolagem verificada em 1654×900, 1366×768 e 1280×720.
