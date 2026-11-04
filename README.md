# EcoPass --- documentação do MVP

O EcoPass é um protótipo web para simular o uso de QR Codes no
estacionamento de um shopping, com saldo virtual, histórico e ofertas de
lojas. O objetivo é demonstrar o conceito em uma feira científica, sem
integração com estacionamento real.

## Documentos

-   `CODEX_INSTRUCTIONS.md`: ordem de implementação e regras de trabalho
    para o Codex.
-   `SPECIFICATION.md`: escopo, funcionalidades e requisitos.
-   `BUSINESS_RULES.md`: tarifas, cronômetro, saldo, entrada, saída e
    pagamentos.
-   `ARCHITECTURE.md`: stack, organização do código e persistência.
-   `UI_AND_UX.md`: telas, navegação e comportamento visual.
-   `TEST_PLAN.md`: critérios de aceitação e testes manuais.

Leia todos os documentos antes de implementar. Em caso de conflito, siga
esta prioridade: `BUSINESS_RULES.md` para regras de negócio;
`SPECIFICATION.md` para escopo; `UI_AND_UX.md` para interface;
`ARCHITECTURE.md` para decisões técnicas.

## Stack definida

-   React
-   Vite
-   TypeScript
-   CSS
-   IndexedDB para persistência local
-   Biblioteca de QR Code compatível com React para renderizar os
    códigos

Não adicionar backend, login, pagamento real, integração bancária, APIs
externas ou hardware de estacionamento no MVP.

## Executar no Windows

1.  Instale uma versão LTS atual do Node.js: https://nodejs.org/
2.  Instale o Visual Studio Code: https://code.visualstudio.com/
3.  Abra no VS Code a pasta do projeto gerada pelo Codex.
4.  No terminal integrado, execute `npm install`.
5.  Execute `npm run dev`.
6.  Abra no navegador o endereço local mostrado pelo Vite no terminal.

Se o PowerShell bloquear os comandos `.ps1` do npm, use `npm.cmd install`,
`npm.cmd run dev`, `npm.cmd test` e `npm.cmd run build` no mesmo terminal.

## Verificações do projeto

- `npm run test`: executa os testes automatizados das tarifas, relógio e filtros do histórico.
- `npm run build`: verifica os tipos TypeScript e gera a versão de produção em `dist/`.

O aplicativo mantém o estado no IndexedDB da origem local, incluindo perfil,
saldo virtual, veículos, sessão ativa, histórico, ofertas e imagens anexadas.

O Codex deve criar os arquivos de configuração necessários, incluindo
`package.json`, configuração do Vite e TypeScript. Não é necessário
instalar nada até o usuário estar pronto para começar.

## Limites importantes

Os dados ficam no navegador e dispositivo usados. Não há sincronização
automática entre aparelhos ou navegadores. Limpar os dados do navegador
pode apagar os dados locais. O protótipo não deve ser apresentado como
sistema real de cobrança ou controle de acesso.
