# Instruções de implementação para o Codex

## Objetivo

Implemente o MVP funcional do EcoPass seguindo os documentos deste
pacote. Não entregue apenas um mockup estático: os botões, abas,
formulários, filtros, cronômetro, cálculos, QR Codes e persistência
devem funcionar.

## Ordem recomendada

1.  Inicialize React + Vite + TypeScript.
2.  Configure CSS global, tema e navegação móvel.
3.  Implemente camada de persistência com IndexedDB e inicialização
    segura.
4.  Implemente perfil e cadastro/seleção de veículos.
5.  Implemente estado e ciclo de vida do estacionamento, relógio e
    cálculo de tarifa.
6.  Implemente saldo simulado e pagamento na saída.
7.  Implemente histórico, filtros e ordenação.
8.  Implemente ofertas e painel de gerenciamento, incluindo imagens
    locais.
9.  Implemente QR Codes e as funções de teste contextuais.
10. Execute verificações TypeScript/lint disponíveis e teste os
    critérios de `TEST_PLAN.md`.
11. Corrija erros antes de considerar a implementação concluída.

## Requisitos de qualidade

-   TypeScript deve estar habilitado; evite `any` sem justificativa.
-   Separe componentes, tipos, regras de negócio e acesso a dados. Não
    concentre todo o aplicativo em um único componente.
-   Mantenha os cálculos tarifários em funções puras e testáveis.
-   Use identificadores únicos para entidades e sessões.
-   Trate carregamento, erros de persistência, formulários vazios e
    estados sem conteúdo.
-   Formate valores monetários em reais (`pt-BR`) e datas/horários de
    forma legível.
-   Não simule operações como concluídas antes de a gravação local
    necessária terminar.
-   Evite duplicar sessões ou cobranças por cliques repetidos.
-   Não coloque dados pessoais reais ou ofertas reais inventadas como
    conteúdo inicial.
-   Não crie autenticação, permissões, servidor, analytics, integração
    externa ou pagamento real.
-   Não peça ao usuário para tomar decisões já estabelecidas nos
    documentos. Se surgir uma lacuna que impeça a implementação, escolha
    a solução mais simples compatível e documente a decisão.

## Persistência

Use IndexedDB para persistir o estado do perfil, veículos, saldo, sessão
ativa, histórico, ofertas e imagens. A persistência deve sobreviver a
atualização e fechamento/reabertura do navegador, dentro do mesmo
navegador e origem.

Armazene imagens como `Blob`/`File` ou formato binário compatível com
IndexedDB; não dependa de URLs temporárias `blob:` persistidas. Crie
URLs temporárias para exibição e revogue-as quando deixarem de ser
necessárias. Valide tipos de imagem aceitos e trate falhas de
leitura/gravação. Não use `localStorage` como armazenamento principal
das entidades.

## Regras que não podem ser alteradas

-   A aba inicial é Estacionamento.
-   A navegação tem quatro abas: Estacionamento, Histórico, Perfil e
    Ofertas.
-   O saldo inicial é R\$ 0,00; não há veículos, histórico ou ofertas
    iniciais.
-   Perfil não é obrigatório para abrir o app, mas é necessário ter pelo
    menos um veículo para iniciar uma sessão.
-   Os primeiros 10 minutos são gratuitos; depois, cobra-se cada hora
    iniciada.
-   Carro: R\$ 10 por hora iniciada; moto: R\$ 7 por hora iniciada.
-   A cobrança é feita uma única vez na saída. O saldo nunca pode ficar
    negativo.
-   Se o saldo for insuficiente, a sessão continua ativa e o pagamento
    pode ser tentado novamente.
-   Durante sessão ativa, não é possível adicionar, editar, selecionar
    ou excluir veículos.
-   Durante sessão ativa, pode-se adicionar ou retirar saldo; a retirada
    não altera a sessão e não pode deixar o saldo negativo.
-   O histórico contém apenas sessões pagas/concluídas.
-   A aba Ofertas começa vazia e todas as ofertas cadastradas aparecem
    imediatamente.
-   QR Codes e leitura são simulados localmente; não usar câmera ou
    leitor físico.
-   A interface deve ter formato de celular também em telas de
    computador.

## Entrega

Ao terminar, informe: - o que foi implementado; - comandos para instalar
e executar; - testes realizados e resultados; - limitações conhecidas; -
qualquer decisão técnica tomada para preencher uma lacuna.

Não alegue que o sistema foi executado ou testado se isso não tiver sido
feito.
