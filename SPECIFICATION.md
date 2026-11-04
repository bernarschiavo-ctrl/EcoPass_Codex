# Especificação funcional do EcoPass

## 1. Propósito

O EcoPass é um MVP demonstrativo que simula a substituição do ticket
físico de estacionamento por QR Codes e apresenta um canal de divulgação
de cupons e promoções de lojas. O protótipo será usado em uma feira
científica.

## 2. Fora do escopo

Não implementar: - controle de cancelas ou leitores reais; - câmera para
ler QR Codes; - cobrança, cartão, Pix ou integração bancária real; -
contas, login ou senhas; - servidor, backend, sincronização ou banco de
dados online; - integração com lojas, validação real de cupons ou portal
de anunciantes; - reconhecimento de placas; - ofertas iniciais
fictícias; - tela de boas-vindas separada.

## 3. Navegação

A aplicação abre diretamente em **Estacionamento**. A navegação inferior
fixa contém quatro abas: 1. Estacionamento 2. Histórico 3. Perfil 4.
Ofertas

Todas as abas são acessíveis desde o início. A interface é mobile-first.
Em telas de computador, manter o mesmo layout estreito de celular,
centralizado, sem criar uma interface desktop diferente.

## 4. Estacionamento

A tela adapta seu conteúdo conforme o estado:

### Sem sessão ativa

-   cabeçalho EcoPass;
-   saldo disponível;
-   faixa de alerta se aplicável;
-   seleção do veículo;
-   QR Code de entrada;
-   caixa "Funções de teste" com a simulação da leitura de entrada e
    controles de saldo pertinentes.

Se não houver veículo cadastrado, explicar que é necessário cadastrar um
veículo na aba Perfil. Não impedir a navegação para as outras abas.

### Com sessão ativa

-   saldo disponível;
-   faixa de alerta persistente quando o saldo não cobrir o valor
    acumulado ou a próxima cobrança necessária;
-   QR Code de saída;
-   tempo decorrido;
-   custo acumulado;
-   indicação clara da tarifa aplicada;
-   caixa "Funções de teste" com modos de tempo, avanço manual,
    simulação da leitura de saída e adição de saldo.

Não permitir trocar de veículo, editar veículos ou excluí-los durante
uma sessão ativa.

### Após saída paga

-   finalizar sessão;
-   descontar o custo uma única vez;
-   gravar a sessão no histórico;
-   limpar o estado ativo;
-   gerar um novo QR Code de entrada.

## 5. Saldo

-   Saldo inicial: R\$ 0,00.
-   É saldo virtual para demonstração; nenhuma transação real ocorre.
-   A caixa de teste permite adicionar R\$ 10, R\$ 20, R\$ 50 ou um
    valor personalizado positivo.
-   A caixa de teste permite retirar um valor personalizado, desde que
    não exceda o saldo.
-   Durante sessão ativa, permitir adicionar e retirar saldo, sem
    ultrapassar o saldo disponível. A retirada não altera a sessão.
-   Adições e retiradas não são registradas no histórico de
    estacionamentos.
-   O saldo nunca fica negativo.

## 6. Perfil e veículos

Campos editáveis de perfil: - nome; - e-mail; - telefone.

Não exigir que o perfil esteja completo para abrir ou usar as abas.

Permitir cadastrar múltiplos veículos. Campos do veículo: - tipo
obrigatório: carro ou moto; - marca/modelo em texto livre; - placa em
texto livre; - apelido opcional.

Não validar formato da placa nem bloquear placas repetidas. Deve haver
seleção de um veículo antes de iniciar uma sessão. O tipo selecionado
determina a tarifa.

Enquanto uma sessão estiver ativa, bloquear seleção, inclusão, edição e
exclusão de veículos. Guardar no registro de histórico uma cópia dos
dados do veículo na data da sessão para que futuras alterações não
modifiquem registros anteriores.

## 7. Histórico

Mostrar apenas estacionamentos concluídos e pagos. Cada item contém: -
data; - horário de entrada; - horário de saída; - duração total; - custo
final; - modelo/marca; - placa; - tipo de veículo.

Filtros combináveis: - período: hoje, últimos 7 dias, últimos 30 dias ou
intervalo personalizado; - veículo por placa/modelo; - ordenação: mais
recente primeiro ou mais antigo primeiro.

Mostrar estado vazio quando ainda não houver sessões concluídas. Sessões
ativas ou pagamentos recusados nunca entram no histórico.

## 8. Ofertas

A aba Ofertas começa vazia. Incluir busca por nome da loja/oferta e
filtros por categoria, por exemplo: Alimentação, Moda, Tecnologia e
Lazer.

Cada oferta pode conter: - nome da loja; - categoria; - título da
promoção; - descrição; - desconto/benefício; - código do cupom; -
validade; - condições; - imagem opcional selecionada do computador; -
indicação de patrocinada.

Se não houver imagem, usar um visual padrão neutro, sem inventar a
identidade visual de uma loja real. Incluir botão para copiar o código
do cupom e confirmação após a cópia.

Incluir um painel de gerenciamento simples dentro do app para adicionar,
editar e excluir ofertas. Não há contas, permissões, rascunhos ou etapa
de publicação. Toda oferta salva aparece imediatamente na aba Ofertas.
Pedir confirmação antes de excluir.

As ofertas são demonstrativas; não prometer que cupons são reais ou
resgatáveis em lojas.

## 9. Mensagens

-   Sucesso: confirmação discreta depois que a operação for concluída.
-   Erro: explicar o que ocorreu e como resolver, quando possível.
-   Exclusão: pedir confirmação.
-   Saldo insuficiente: faixa de aviso persistente até o problema ser
    resolvido.
-   Não declarar pagamento concluído antes de confirmar a gravação do
    estado correspondente.

## 10. Persistência

Usar IndexedDB para salvar perfil, saldo, veículos, sessão ativa,
histórico, ofertas e imagens. A atualização da página e o
fechamento/reabertura do navegador não devem apagar os dados, desde que
o usuário permaneça no mesmo navegador e origem e os dados do site não
sejam apagados.

Não há sincronização entre dispositivos ou navegadores.
