# Interface e experiência do usuário

## 1. Direção visual

-   Estética limpa, minimalista e sustentável.
-   Paleta predominantemente verde, com fundos brancos ou verde-claro e
    verde-escuro para contraste.
-   Cartões com cantos arredondados discretos.
-   Tipografia simples, legível e consistente.
-   Ícones minimalistas.
-   Evitar excesso de folhas, texturas ou ornamentos.
-   Erros e avisos devem ter contraste visual próprio e não depender
    apenas do verde.

## 2. Formato

-   Projetar para celular primeiro.
-   Em computador, manter a mesma tela estreita de celular,
    centralizada, sem layout desktop alternativo.
-   Navegação inferior fixa com ícone e rótulo.
-   Abas: Estacionamento, Histórico, Perfil, Ofertas.
-   A aba Estacionamento é selecionada ao abrir o app.
-   Deixar espaço no fim do conteúdo para que a navegação inferior não
    cubra elementos.

## 3. Estacionamento --- sem sessão

Ordem sugerida: 1. cabeçalho/logo EcoPass; 2. cartão de saldo; 3. faixa
de aviso, quando necessária; 4. seletor de veículo; 5. QR Code de
entrada; 6. caixa expansível "Funções de teste"; 7. navegação inferior
fixa.

Se não houver veículos, mostrar estado vazio com instrução direta:
"Cadastre um veículo em Perfil para iniciar um estacionamento." Não
esconder as outras abas.

A caixa de teste deve ser visualmente separada, por exemplo com borda
tracejada e título explícito. Ela pode ser expandida ou recolhida.

## 4. Estacionamento --- sessão ativa

Ordem sugerida: 1. cabeçalho/logo; 2. saldo; 3. aviso persistente, se o
saldo não for suficiente; 4. QR Code de saída; 5. tempo decorrido; 6.
custo acumulado e tarifa aplicada; 7. "Funções de teste"; 8. navegação
inferior.

O tempo deve ser fácil de ler. Distinguir visualmente o custo acumulado
do saldo disponível. Não confundir custo acumulado com uma cobrança já
efetuada.

## 5. Funções de teste contextuais

Mostrar apenas controles pertinentes ao estado e à aba: - antes da
entrada: simular leitura do QR de entrada e controles de saldo; -
durante a sessão: modos de relógio, avanços manuais, simular leitura do
QR de saída e controles para adicionar e retirar saldo; - fora da aba
Estacionamento, não mostrar controles de cronômetro.

Os controles de teste devem parecer claramente ferramentas de
demonstração, não funções reais do estacionamento.

## 6. Perfil

Mostrar campos de nome, e-mail e telefone editáveis. Listar veículos
cadastrados e oferecer cadastro/edição/exclusão, com tipo, marca/modelo,
placa e apelido opcional. Não exigir preenchimento de todos os dados do
perfil.

Durante sessão ativa, bloquear inclusão, edição, seleção e exclusão de
veículos e explicar o motivo.

## 7. Histórico

Mostrar filtros compactos e combináveis, lista de estacionamentos
concluídos e pagos e um estado vazio claro. Cada registro deve mostrar
custo final, duração, entrada/saída e veículo. Ordenação por mais
recente/mais antigo.

## 8. Ofertas

A aba começa vazia, com uma explicação breve e botão para adicionar a
primeira oferta. Quando houver ofertas, mostrar cartões com imagem (ou
imagem padrão), loja, categoria, título, benefício, código, validade e
condições. Incluir busca, filtros de categoria, ação de copiar cupom e
sinalização de patrocinada quando aplicável.

O painel de gerenciamento deve permitir adicionar, editar e excluir.
Confirmar exclusão. Salvar uma oferta deve torná-la visível
imediatamente.

## 9. Feedback

-   Confirmações de sucesso discretas.
-   Erros explicados em linguagem simples.
-   Confirmação para ações destrutivas.
-   Aviso de saldo insuficiente persistente enquanto aplicável.
-   Estados vazios para histórico, veículos e ofertas.
-   Botões desabilitados quando a ação não é permitida, com explicação
    próxima quando necessário.

## 10. Texto e localização

Usar português do Brasil em toda a interface. Valores em reais e
datas/horários localizados. Evitar termos técnicos desnecessários para o
usuário final.
