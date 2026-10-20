# Changelog

Todas as mudanças relevantes do projeto ficam registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.1.1] - 2026-10-20

### Corrigido
- A GitHub Action de aprovação agora salva os envios sempre no `main`, que é a branch publicada, mesmo que a branch padrão seja outra.

## [0.1.0] - 2026-10-20

### Adicionado
- Catálogo automático de addons do Create Aeronautics e do Sable a partir da API do Modrinth, atualizado a cada hora.
- Página inicial com busca, filtros por categoria, loader e versão do Minecraft, e ordenação.
- Links para o CurseForge dos principais addons.
- Fila de revisão (`/review`, só em desenvolvimento) para projetos que apenas citam o Aeronautics.
- Formulário de envio com proteção contra spam e bloqueio de duplicados.
- GitHub Action que aplica os envios aprovados.
- Página sobre o projeto.
