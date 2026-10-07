# FB Aero Control MRO

Sistema de Gestão de Manutenção Aeronáutica (MRO) para engenheiros, mecânicos e pilotos: controle de TBO,
rastreabilidade de componentes, ordens de serviço e log de auditoria imutável.

> **Status:** em desenvolvimento. Login com perfis de acesso, cadastro de usuários e cadastro de aeronaves concluídos.

## Funcionalidades

**Prontas**

- Login por matrícula ou e-mail, com seleção da base de operação (ex.: SBGR, SBKP, SBCF)
- Autenticação com token JWT e sessão de 8 horas (um turno de trabalho)
- Perfis de acesso com permissões: Engenheiro / Administrador, Mecânico / Técnico e Piloto / Operador
- Cadastro de usuários (colaboradores): criação, edição, ativação/desativação, redefinição de senha,
  bases autorizadas e busca com filtros por perfil e situação
- Cadastro de aeronaves: matrícula, modelo, fabricante, número de série, base, horas de voo, ciclos e status
  (Operacional, Em manutenção, AOG - Parada, Inativa)
- Fotos de aeronaves e de colaboradores (JPG, PNG ou WebP, até 5 MB)
- Log de auditoria imutável: logins, tentativas negadas e alterações em usuários, aeronaves e fotos
- Estrutura do banco versionada com Flyway
- Interface responsiva (celular, tablet, notebook e monitores grandes)

**Próximas etapas (MVP)**

- Cadastro de componentes controlados (motores, trens de pouso, aviônicos) com limite de TBO
- Painel de saúde das peças: status *Warning* ao restar menos de 10% das horas até o TBO e *Critical* ao atingi-lo
- Ordens de Serviço (Aberta, Em andamento, Concluída) com registro de trocas de peças
- Registro de horas de voo, atualizando o desgaste das peças automaticamente

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Front-end | React 18, Vite, CSS |
| Back-end | Java 17, Spring Boot 4, Spring Security, Spring Data JPA, JWT |
| Banco de dados | PostgreSQL (produção), H2 em modo PostgreSQL (desenvolvimento), Flyway |
| Testes | JUnit 5, MockMvc, Spring Security Test |

## Estrutura do repositório

```
aerocontrol-system/
├── back-end/aerocontrol-api/  # API REST (Spring Boot)
│   └── src/main/resources/db/migration/   # scripts do banco (Flyway)
└── front-end/                 # Interface web (React + Vite)
```

### Organização da API

A API é um **monólito modular**: uma única aplicação Spring Boot, dividida em módulos de negócio
independentes (pacote raiz `br.com.aerocontrol`).

```
br.com.aerocontrol/
├── shared/       # recursos comuns: auditoria, tratamento de erros, upload de fotos
├── security/     # JWT, filtro de autenticação e configuração do Spring Security
├── auth/         # login e sessão
├── base/         # bases de manutenção (SBGR, SBKP, SBCF...)
├── user/         # usuários (colaboradores) e perfis de acesso
└── aircraft/     # aeronaves
```

Cada módulo segue as mesmas camadas:

| Camada | Conteúdo |
|---|---|
| `api/` | Controllers REST: recebem e devolvem DTOs, sem regra de negócio |
| `application/` | Services (regras de negócio e transações) e DTOs |
| `domain/` | Entidades JPA e repositórios |

Regras:

- Um módulo nunca acessa o repositório de outro; usa o service público dele (ex.: `BaseService`).
- `shared/` guarda apenas infraestrutura comum, nunca regra de negócio.
- Um novo domínio (ex.: componentes, ordens de serviço) vira um novo módulo com as mesmas camadas.

### Organização do front-end

O front-end separa **telas** (`pages/`) de um **design system** reutilizável (`components/` + `styles/`).

```
front-end/src/
├── main.jsx              # ponto de entrada
├── app/App.jsx           # raiz: tela de login ou área logada, conforme a sessão
├── pages/                # uma pasta por tela, com nome em português
│   ├── login/            # PaginaLogin.jsx + PaginaLogin.css
│   ├── inicio/           # PaginaInicio
│   ├── aeronaves/        # PaginaAeronaves + components/ (formulário) + modals/ (modais da tela)
│   └── usuarios/         # PaginaUsuarios + components/ + modals/
├── components/           # design system: peças reutilizáveis, sem regra de negócio
│   ├── botoes/           # Botao, BotaoIcone, BotaoLink
│   ├── modal/            # Modal base
│   ├── avisos/           # Notificacao (flutuante) e Alerta (aviso na página)
│   ├── foto/             # Avatar, MolduraFoto, SeletorFoto
│   ├── marca/            # Logo e RelogioBrasilia
│   └── layout/           # AppShell: barra do topo e menu lateral
├── styles/
│   ├── fonts/            # fonte IBM Plex Sans (self-hosted) e escala tipográfica
│   ├── tokens.css        # cores, bordas, sombras e alturas
│   ├── base.css          # reset e regras globais
│   └── ui/               # padrões compartilhados: cabeçalho, tabela, filtros, formulário, avisos
├── hooks/                # usePhoto, usePhotoField
├── services/             # api/ (cliente HTTP por domínio) e session.js
├── utils/                # formatters (datas e números pt-BR), regras da foto
└── assets/images/
```

Regras:

- **Botões:** sempre `Botao`, `BotaoIcone` ou `BotaoLink` de `components/botoes`, nunca `<button className="btn">`.
  `Botao` tem as variantes `primary`, `secondary`, `danger` e `ghost-light`, e os tamanhos `sm`, `md` e `lg`.
- **Cores e fontes:** só pelos tokens (`var(--color-*)`, `var(--font-size-*)`, `var(--font-weight-*)`),
  nunca valores soltos no CSS.
- **Telas:** cada tela tem a sua pasta em `pages/` com nome em português (`usuarios/`, `aeronaves/`), e o
  componente da tela segue o padrão `Pagina<Nome>` (ex.: `PaginaUsuarios.jsx`).
- **Modais:** o `Modal` base fica em `components/modal`; o modal de uma tela fica em `pages/<tela>/modals/`.
- **Imports:** `@/` aponta para `src/` (ex.: `import { Botao } from '@/components/botoes'`); caminho relativo
  só dentro da mesma pasta.
- **Estilos:** o CSS de cada componente e de cada tela fica ao lado do `.jsx`; o que é compartilhado entre
  telas fica em `styles/ui/`.

## Como rodar

### Pré-requisitos

- [Java 17](https://adoptium.net/) ou superior
- [Node.js 18](https://nodejs.org/) ou superior
- Git

Não é preciso instalar banco de dados: em desenvolvimento a API usa um banco H2 salvo em arquivo.

### 1. Clonar o repositório

```bash
git clone https://github.com/fabio-furlan/aerocontrol-system.git
cd aerocontrol-system
```

### 2. Iniciar a API (terminal 1)

```bash
cd back-end/aerocontrol-api
./mvnw spring-boot:run
```

> No Windows (PowerShell ou CMD), use `.\mvnw spring-boot:run`.

A API sobe em `http://localhost:8081` e leva alguns segundos. Aguarde a mensagem
`Started AeroControlApplication` no terminal. Na primeira execução, o Flyway cria as tabelas
e são criados os usuários de demonstração.

### 3. Iniciar o front-end (terminal 2)

```bash
cd front-end
npm install
npm run dev
```

Acesse **http://localhost:5173**.

> Os dois precisam estar rodando ao mesmo tempo. Se a tela mostrar
> *"Não foi possível carregar as bases"*, a API não está no ar.

### 4. Entrar no sistema

Usuários de demonstração (senha de todos: `Demo@2026`). Também é possível entrar pelo e-mail.

| Matrícula | E-mail | Perfil | Bases autorizadas |
|---|---|---|---|
| `ENG001` | engenheiro@fbaero.dev | Engenheiro / Administrador | SBGR, SBKP, SBCF |
| `MEC001` | mecanico@fbaero.dev | Mecânico / Técnico | SBGR, SBKP |
| `PIL001` | piloto@fbaero.dev | Piloto / Operador | SBGR |

Para ver o bloqueio por base, tente entrar com `PIL001` na base SBKP.

### Rodar os testes

```bash
cd back-end/aerocontrol-api
./mvnw test
```

### Recomeçar o banco local do zero

Pare a API e apague a pasta `back-end/aerocontrol-api/data/`. Na próxima execução o banco é recriado.

## Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| Engenheiro / Administrador | Cadastrar usuários e aeronaves, definir limites de TBO, aprovar auditorias e todas as demais ações |
| Mecânico / Técnico | Abrir Ordens de Serviço, registrar trocas de peças e atualizar o status de manutenção |
| Piloto / Operador | Registrar as horas de voo da aeronave |

## Configuração para produção

A API usa o perfil `prod` com PostgreSQL (ex.: [Neon](https://neon.tech/) ou [Supabase](https://supabase.com/)).
Nenhuma credencial fica no código: tudo vem de variáveis de ambiente.

| Variável | Descrição |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | URL JDBC, ex.: `jdbc:postgresql://host:5432/aerocontrol?sslmode=require` |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Credenciais do banco |
| `JWT_SECRET` | Chave de assinatura dos tokens (texto longo e aleatório) |
| `CORS_ALLOWED_ORIGINS` | Endereço do front-end publicado |
| `SEED_DEMO_USERS` / `DEMO_PASSWORD` | Opcional: cria os usuários de demonstração |

No front-end, defina `VITE_API_URL` com o endereço da API publicada (veja `front-end/.env.example`).

## Fluxo de desenvolvimento

- `main`: versões estáveis
- `develop`: integração das novas funcionalidades
- `feature/*` (ou `refactor/*`, `fix/*`): uma branch por alteração, criada a partir da `develop`
  e integrada a ela via Pull Request
- Quando a `develop` estiver estável, um Pull Request `develop` → `main` publica a nova versão
- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (ex.: `feat(back): ...`)
