# Nova agenda

Implementação baseada no ZIP enviado em 24/10/2026, preservando os ajustes do filtro individual de assuntos, os indicadores de tarefas e as cores azul/azul-marinho.

A agenda agora tem mini calendário lateral, filtros de tipo e origem, busca, abas Dia/Semana/Mês e grade de 24 horas com intervalos de meia hora. Os cartões mostram os registros existentes, com posicionamento por hora e separação lateral em caso de sobreposição. Registros sem horário ficam na faixa superior.

Clique no horário vazio para criar uma tarefa com data e hora preenchidas. Clique no cartão para abrir o registro. O formulário na agenda aparece sobre a grade; os campos adicionais ficam disponíveis em Mais detalhes. Eventos importados continuam somente leitura. A importação ICS, os blocos recorrentes e as sugestões permanecem acessíveis.

Validação: 108 testes passaram. Verificado em navegador: 336 intervalos na semana, visualizações dia/semana/mês, busca, filtros, detalhes de evento, criação/gravação/reabertura de tarefa às 14:30 e responsividade em 1280×720 e 390×844 sem transbordamento lateral da página. O teste web passou na versão modular e no HTML único. Não foi executado o Electron nativo.

Para abrir sem instalação, use dist/techlead-desk-unico.html no Chrome ou Edge. O JSON local permanece compatível.

## Rolagem e ferramentas

Os painéis de atenção, importação e sugestões agora são abertos pelo menu Ferramentas, no topo da agenda, em uma janela própria. A página e a barra superior ficam fixas: apenas a grade de eventos rola. Verificado em dia, semana e mês a 1580×900, 1280×720 e 390×844, incluindo abrir os três painéis e criar por horário. 109 testes passaram.
