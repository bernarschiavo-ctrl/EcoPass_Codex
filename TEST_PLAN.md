# Plano de testes e critérios de aceitação

Execute os testes abaixo manualmente no navegador e, quando viável, crie
testes automatizados para as funções puras de tarifa e transição de
estado.

## 1. Inicialização e persistência

-   [ ] O app abre diretamente em Estacionamento.
-   [ ] As quatro abas estão disponíveis.
-   [ ] O saldo inicial é R\$ 0,00.
-   [ ] Veículos, histórico e ofertas começam vazios.
-   [ ] Após atualizar a página, os dados cadastrados continuam
    presentes.
-   [ ] Após fechar e reabrir o navegador na mesma origem, os dados
    continuam presentes.
-   [ ] O cronômetro de uma sessão ativa não reinicia ao atualizar.
-   [ ] Falhas no IndexedDB são mostradas sem declarar sucesso ou apagar
    dados silenciosamente.

## 2. Perfil e veículos

-   [ ] Nome, e-mail e telefone podem ser editados.
-   [ ] É possível cadastrar mais de um veículo.
-   [ ] Tipo, marca/modelo e placa são aceitos em texto livre; apelido é
    opcional.
-   [ ] Não há validação rígida de formato de placa nem bloqueio de
    placas repetidas.
-   [ ] Não é possível iniciar uma sessão sem veículo selecionado.
-   [ ] Durante sessão ativa, inclusão, edição, seleção e exclusão de
    veículos ficam bloqueadas.
-   [ ] O histórico preserva o snapshot do veículo usado na sessão.

## 3. Tarifas

Verificar o cálculo de forma automatizada ou manual:

  Tempo decorrido     Carro esperado   Moto esperada
  ----------------- ---------------- ---------------
  0 min                     R\$ 0,00        R\$ 0,00
  10 min                    R\$ 0,00        R\$ 0,00
  11 min                   R\$ 10,00        R\$ 7,00
  60 min                   R\$ 10,00        R\$ 7,00
  70 min                   R\$ 10,00        R\$ 7,00
  71 min                   R\$ 20,00       R\$ 14,00
  130 min                  R\$ 20,00       R\$ 14,00
  131 min                  R\$ 30,00       R\$ 21,00

-   [ ] A tarifa da sessão depende do tipo de veículo selecionado na
    entrada.
-   [ ] Alterações futuras no veículo não mudam uma sessão já iniciada.

## 4. Cronômetro de teste

-   [ ] Tempo real progride corretamente.
-   [ ] Os modos 10×, 60× e 300× aceleram o relógio simulado.
-   [ ] Avanços manuais de 10 min, 30 min e 1 h alteram o tempo e o
    custo.
-   [ ] Trocar o modo não apaga tempo acumulado.
-   [ ] Mudanças repetidas entre velocidades preservam o tempo simulado
    acumulado e alteram somente o avanço futuro.
-   [ ] Apenas um modo está ativo por vez.
-   [ ] Atualizar a página não reinicia a sessão.
-   [ ] Não existem botões de pausar ou reiniciar manualmente.
-   [ ] O cronômetro não acumula intervalos concorrentes após várias
    trocas de modo.
-   [ ] Recarregar preserva o modo e o tempo acumulado em milissegundos;
    tempo exibido, duração no histórico e custo usam o mesmo tempo
    simulado.

## 5. Saldo

-   [ ] É possível adicionar R\$ 10, R\$ 20, R\$ 50 e valor
    personalizado positivo.
-   [ ] É possível retirar valor personalizado sem deixar saldo
    negativo.
-   [ ] É possível retirar saldo durante sessão ativa sem alterar a
    sessão ou o cronômetro.
-   [ ] Retiradas que excedem o saldo são recusadas e o saldo nunca fica
    negativo, inclusive durante sessão ativa.
-   [ ] Se a retirada deixar saldo insuficiente, a sessão permanece
    ativa e aceita adição de saldo para pagar a saída.
-   [ ] É possível adicionar saldo durante sessão ativa.
-   [ ] Adições e retiradas não aparecem no histórico de estacionamento.
-   [ ] Valores monetários são calculados em centavos, sem erros de
    ponto flutuante.

## 6. Entrada, QR e saída

-   [ ] Sem veículo, a simulação de entrada não inicia sessão e explica
    o motivo.
-   [ ] Com veículo selecionado, a leitura simulada de entrada inicia
    uma única sessão.
-   [ ] QR de entrada não inicia outra sessão quando já existe uma
    ativa.
-   [ ] Durante sessão ativa, é exibido QR de saída.
-   [ ] Com saldo suficiente, a leitura simulada de saída debita o custo
    uma vez e encerra a sessão.
-   [ ] Pagamento bem-sucedido cria exatamente um registro no histórico.
-   [ ] Clique duplo ou repetição da operação não duplica a cobrança nem
    o histórico.
-   [ ] Com saldo insuficiente, nenhum valor é debitado, a sessão
    continua ativa e o aviso persiste.
-   [ ] Depois de adicionar saldo suficiente, nova tentativa conclui o
    pagamento.
-   [ ] QR antigo ou consumido não executa novamente a operação.
-   [ ] Após saída paga, o app fica pronto para nova entrada.

## 7. Histórico

-   [ ] Só sessões pagas aparecem.
-   [ ] Data, entrada, saída, duração, custo e snapshot do veículo estão
    corretos.
-   [ ] Filtros de hoje, 7 dias, 30 dias e intervalo personalizado
    funcionam.
-   [ ] Filtro por veículo funciona.
-   [ ] Filtros podem ser combinados.
-   [ ] Ordenação crescente/decrescente de data funciona.
-   [ ] Estado vazio é exibido quando não existem sessões concluídas.

## 8. Ofertas e imagens

-   [ ] A lista inicial está vazia.
-   [ ] É possível criar, editar e excluir ofertas.
-   [ ] Excluir pede confirmação.
-   [ ] Uma oferta salva aparece imediatamente na lista.
-   [ ] Busca e filtros de categoria funcionam.
-   [ ] Código do cupom pode ser copiado com confirmação.
-   [ ] Imagem selecionada persiste após atualizar e reabrir.
-   [ ] Oferta sem imagem usa imagem padrão.
-   [ ] Erros de imagem ou armazenamento são tratados de forma clara.
-   [ ] Não há ofertas reais inventadas nem integração real com lojas.

## 9. Interface e responsividade

-   [ ] Em celular, o conteúdo não fica cortado horizontalmente.
-   [ ] Em computador, o layout mantém formato móvel centralizado.
-   [ ] A navegação fixa não cobre campos ou botões.
-   [ ] Contraste e tamanho dos textos são legíveis.
-   [ ] Erros não são comunicados apenas por cor.
-   [ ] Todos os campos têm rótulos e os botões têm estados claros.

## 10. Verificação final

-   [ ] `npm install` termina sem erro.
-   [ ] `npm run dev` inicia o app.
-   [ ] Verificação TypeScript e/ou build de produção termina sem erro,
    se configurada.
-   [ ] Não existem erros críticos no console do navegador durante os
    fluxos principais.
-   [ ] O Codex documenta os testes que realmente executou e as
    limitações restantes.
