# Regras de negócio e cálculos

## 1. Tarifas

Os primeiros 10 minutos são gratuitos para carro e moto. Depois disso,
cada hora iniciada é cobrada integralmente: - Carro: R\$ 10,00 por hora
iniciada. - Moto: R\$ 7,00 por hora iniciada.

Para `t` minutos decorridos desde a entrada:

-   Se `t <= 10`, custo = R\$ 0,00.
-   Se `t > 10`, horas cobradas = `ceil((t - 10) / 60)`.
-   Custo de carro = horas cobradas × R\$ 10,00.
-   Custo de moto = horas cobradas × R\$ 7,00.

Exemplos: \| Duração total \| Carro \| Moto \| \|---\|---:\|---:\| \| 10
min \| R\$ 0,00 \| R\$ 0,00 \| \| 11 min \| R\$ 10,00 \| R\$ 7,00 \| \|
60 min \| R\$ 10,00 \| R\$ 7,00 \| \| 70 min \| R\$ 10,00 \| R\$ 7,00 \|
\| 71 min \| R\$ 20,00 \| R\$ 14,00 \| \| 130 min \| R\$ 20,00 \| R\$
14,00 \| \| 131 min \| R\$ 30,00 \| R\$ 21,00 \|

Use minutos/segundos decorridos de forma consistente para evitar erros
de arredondamento. A regra é por hora iniciada depois dos 10 minutos
gratuitos, não por blocos de 60 minutos contados desde a entrada.

## 2. Saldo e pagamento

-   O saldo começa em zero e nunca fica negativo.
-   O saldo pode ser adicionado ou retirado durante uma sessão ativa.
-   Uma retirada não altera a sessão, o relógio simulado nem o custo
    acumulado; se o saldo restante for insuficiente para a saída, a
    sessão continua ativa até que saldo suficiente seja adicionado.
-   O custo acumulado é separado do saldo e só é debitado no pagamento
    da saída.
-   O custo pode ser maior que o saldo disponível; nesse caso, a saída
    não pode ser concluída.
-   Um pagamento só é aprovado se `saldo >= custo final`.
-   Ao aprovar, debitar exatamente o custo final uma única vez e
    finalizar a sessão.
-   Se não houver saldo suficiente, não debitar nada, não finalizar a
    sessão e não adicionar registro ao histórico.
-   Após adicionar saldo suficiente, a simulação da leitura do QR de
    saída pode ser repetida.
-   Proteja contra cliques duplos, chamadas repetidas e reutilização de
    um QR já consumido.
-   Em caso de falha ao persistir a operação, não mostrar sucesso.
    Manter estado recuperável e evitar cobrança duplicada em nova
    tentativa.

## 3. Início da sessão

-   É obrigatório ter um veículo cadastrado e selecionado.
-   A entrada é uma simulação local disparada por um controle de teste.
-   Registrar instante inicial e identificador único de sessão.
-   Os primeiros 10 minutos são gratuitos; não exigir saldo para cobrir
    cobranças que ainda não ocorreram durante o período gratuito.
-   O tipo do veículo é copiado para a sessão no momento da entrada;
    mudanças posteriores não devem mudar a tarifa da sessão.
-   Só pode existir uma sessão ativa por vez.

## 4. Aviso de saldo

Durante a sessão, mostrar uma faixa persistente quando o saldo não
cobrir o custo acumulado atual ou a próxima cobrança aplicável. Texto
sugerido: "Saldo insuficiente para cobrir o estacionamento. Adicione
saldo para conseguir concluir o pagamento na saída."

O aviso desaparece quando o saldo for suficiente para cobrir o valor
acumulado e a próxima cobrança aplicável. Se o custo ultrapassar o saldo
enquanto a sessão segue ativa, o custo continua aumentando, mas o saldo
não é debitado até uma tentativa de saída aprovada.

## 5. Relógio e modos de teste

Modos disponíveis na caixa "Funções de teste" durante uma sessão
ativa: - tempo real (1×); - acelerado 10×; - acelerado 60×; - acelerado
300×; - avanço manual de 10 minutos; - avanço manual de 30 minutos; -
avanço manual de 1 hora.

Somente um modo de relógio pode estar ativo por vez. Trocar o modo não
pode apagar o tempo acumulado. Não oferecer pausa ou reinício manual.

### Persistência correta do tempo

Não usar apenas um contador em memória que zere ao atualizar a página.
Salvar o estado temporal em IndexedDB e reconstruir o tempo decorrido ao
carregar.

Para tempo real, usar o instante de entrada persistido. Para os modos
acelerados, modelar um relógio simulado persistente: salvar o tempo
simulado acumulado e o instante real de referência, aplicar a velocidade
selecionada e atualizar a referência ao trocar de velocidade. O avanço
manual adiciona minutos ao relógio simulado. Atualizações do cronômetro
devem ser derivadas desse estado persistido, não de múltiplos intervalos
concorrentes.

A troca de modo precisa manter o tempo acumulado e evitar saltos
acidentais. Depois de atualizar a página, o cronômetro deve continuar
coerente com o modo persistido.

## 6. QR Codes e estado da sessão

-   Gerar payloads únicos para entrada e saída e renderizá-los como QR
    Codes.
-   Não incluir informações pessoais desnecessárias no payload.
-   A leitura é simulada por botões nas "Funções de teste"; não usar
    câmera.
-   Validar o tipo do código e o estado atual antes de agir.
-   QR de entrada só pode iniciar uma sessão quando não houver sessão
    ativa.
-   QR de saída só pode tentar finalizar a sessão correspondente.
-   Um código consumido ou incompatível com o estado atual não pode
    iniciar outra sessão nem provocar cobrança.
-   Em caso de pagamento insuficiente, manter sessão e QR de saída
    válidos para nova tentativa.
-   Após pagamento bem-sucedido, invalidar o QR de saída usado e
    disponibilizar novo QR de entrada.

## 7. Histórico

Criar um registro somente após o pagamento ser aprovado. Salvar instante
de entrada, instante de saída, duração total calculada, custo pago e
snapshot do veículo. A sessão não pode ser inserida mais de uma vez.
