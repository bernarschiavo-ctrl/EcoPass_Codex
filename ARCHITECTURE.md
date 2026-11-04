# Arquitetura técnica

## 1. Stack

-   React + Vite + TypeScript
-   CSS próprio, com variáveis de tema
-   IndexedDB como persistência principal
-   Biblioteca de QR Code compatível com React

Não usar backend, autenticação ou APIs externas no MVP.

## 2. Organização sugerida

O Codex pode adaptar nomes se mantiver separação de responsabilidades.
Uma estrutura recomendada:

``` text
src/
  app/
    App.tsx
    navigation.ts
  components/
    BottomNavigation.tsx
    Header.tsx
    BalanceCard.tsx
    WarningBanner.tsx
    QrPanel.tsx
    TestFunctions.tsx
    EmptyState.tsx
    ConfirmDialog.tsx
    Toast.tsx
  features/
    parking/
      ParkingScreen.tsx
      parkingService.ts
      tariff.ts
      parkingClock.ts
    history/
      HistoryScreen.tsx
      historyFilters.ts
    profile/
      ProfileScreen.tsx
      VehicleForm.tsx
    offers/
      OffersScreen.tsx
      OfferForm.tsx
      OfferManagement.tsx
  data/
    db.ts
    repositories.ts
  types/
    index.ts
  utils/
    currency.ts
    dateTime.ts
  styles/
    global.css
    theme.css
  main.tsx
```

A estrutura é uma orientação; o objetivo principal é manter a lógica
tarifária e de persistência separadas dos componentes visuais.

## 3. Entidades sugeridas

### Profile

-   `id`
-   `name`
-   `email`
-   `phone`

### Vehicle

-   `id`
-   `type`: `car` ou `motorcycle`
-   `makeModel`
-   `plate`
-   `nickname` opcional
-   `createdAt`, `updatedAt`

### Wallet

-   identificador estável
-   `balanceCents` como inteiro, para evitar erros de ponto flutuante

### ActiveParkingSession

-   `id`
-   `vehicleSnapshot` (tipo, marca/modelo, placa e apelido no início)
-   `entryAt`
-   `clockMode`
-   `elapsedMilliseconds`: tempo simulado acumulado, sempre em milissegundos
-   `clockReferenceAt`: instante real de referência, em milissegundos Unix
-   `entryQrToken`
-   `exitQrToken`
-   `status`
-   `lastUpdatedAt`

### ParkingHistoryEntry

-   `id`
-   `sessionId`
-   `entryAt`
-   `exitAt`
-   `durationMilliseconds`: duração simulada, em milissegundos
-   `costCents`
-   `vehicleSnapshot`
-   identificador do QR de saída consumido ou estado de conclusão, para
    idempotência

### Offer

-   `id`
-   `storeName`
-   `category`
-   `title`
-   `description`
-   `benefit`
-   `couponCode`
-   `validUntil`
-   `conditions`
-   `sponsored`
-   `imageBlob` ou referência à imagem guardada no IndexedDB
-   `createdAt`, `updatedAt`

Os valores monetários devem ser guardados como inteiros em centavos.
Converter para reais apenas na apresentação.

## 4. IndexedDB

Criar uma camada única de inicialização/acesso à base local. Organizar
stores para perfil, veículos, carteira, sessão ativa, histórico e
ofertas. A imagem deve ser armazenada em formato binário adequado;
evitar guardar somente uma URL `blob:` porque ela não sobrevive à
próxima sessão do navegador.

Ao atualizar dados relacionados --- por exemplo, debitar carteira,
concluir sessão e gravar histórico --- usar uma transação IndexedDB
sempre que possível para manter consistência. Se houver erro, não exibir
sucesso nem deixar um estado parcialmente concluído sem recuperação.

Na troca de velocidade, acumular o intervalo anterior na mesma unidade
antes de salvar a nova referência e velocidade. A versão 2 da base migra
sessões e históricos da versão anterior de segundos para milissegundos.

Ao iniciar a aplicação: 1. abrir a base; 2. carregar perfil, carteira,
veículos, sessão ativa, histórico e ofertas; 3. validar/recuperar a
sessão ativa; 4. renderizar a aba Estacionamento; 5. mostrar erros de
armazenamento de forma compreensível, sem apagar dados silenciosamente.

## 5. QR Codes

O QR Code deve conter um payload mínimo, com versão, tipo da operação,
identificador da sessão (quando aplicável) e token único. A aplicação
renderiza o payload com uma biblioteca QR.

Como não há leitor físico nem servidor, a função de teste chama a mesma
lógica de validação local que seria chamada após uma leitura simulada.
Não fingir que uma câmera leu o código. Um token aleatório local ajuda a
distinguir códigos e sessões, mas não deve ser descrito como segurança
de nível de produção.

## 6. Estado e concorrência

-   Manter uma única fonte de verdade para saldo e sessão ativa.
-   Bloquear ações incompatíveis com o estado atual.
-   Impedir que dois cliques rápidos finalizem a mesma sessão duas
    vezes.
-   Atualizar o cronômetro a partir de um relógio derivado do estado
    persistido.
-   Persistir mudanças importantes antes de apresentar uma confirmação
    de sucesso.

## 7. Design responsivo

Definir um contêiner de largura móvel máxima, centralizado em telas
grandes. Em desktop, manter a mesma disposição vertical de celular.
Navegação inferior fixa, com espaço inferior no conteúdo para não cobrir
botões ou textos. Garantir que os avisos e o teclado virtual não ocultem
os campos.

## 8. Acessibilidade e robustez

-   Contraste suficiente e texto legível.
-   Não comunicar alertas apenas pela cor.
-   Rótulos visíveis em campos.
-   Foco visível para navegação por teclado.
-   Botões com estados desabilitados claros.
-   Mensagens de erro específicas.
-   Formatação monetária em `pt-BR`.
-   Não apagar dados em caso de erro de leitura; mostrar a falha e
    preservar o que for possível.
