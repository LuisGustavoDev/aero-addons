# Changelog

Todas as mudanças relevantes do projeto ficam registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-10-20

### Adicionado
- 39 testes automatizados (Vitest) para as regras de inclusão, categorias, validação do formulário, arquivos de dados e o script de aprovação.
- Teste de fumaça das páginas publicadas, inclusive em deploys protegidos da Vercel.
- CI no GitHub Actions com lint, tipos, testes, build e teste de fumaça.
- Deploy em produção na Vercel a cada push no `main`, só depois da verificação. O deploy novo é testado antes de ir ao ar, e o site volta para a versão anterior se quebrar.
- Envios aprovados são publicados automaticamente.

### Alterado
- As regras de inclusão de addons foram extraídas para `src/lib/classify.ts`.
- O commit automático de aprovação segue o padrão `chore(data)`.
- Tipos do Node atualizados para a versão 24.

### Corrigido
- A checagem de tipos funcionava só depois de um build, porque os tipos de rota do Next.js não eram gerados antes.

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
