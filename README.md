# FB Aero Control MRO

Sistema de Gestão de Manutenção Aeronáutica (MRO) para engenheiros, mecânicos e pilotos: controle de TBO,
rastreabilidade de componentes, ordens de serviço e log de auditoria imutável.

> **Status:** em desenvolvimento. Login com perfis de acesso e estrutura do banco de dados concluídos.

## Funcionalidades

**Prontas**

- Login por matrícula ou e-mail, com seleção da base de operação (ex.: SBGR, SBKP, SBCF)
- Autenticação com token JWT e sessão de 8 horas (um turno de trabalho)
- Perfis de acesso com permissões: Engenheiro / Administrador, Mecânico / Técnico e Piloto / Operador
- Log de auditoria imutável: logins e tentativas negadas ficam registrados
- Estrutura completa do banco para o MVP, versionada com Flyway
- Interface responsiva (celular, tablet, notebook e monitores grandes)

**Próximas etapas (MVP)**

- Cadastro de usuários e permissões de acesso
- Cadastro de aeronaves e de componentes controlados (motores, trens de pouso, aviônicos) com limite de TBO
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
- `feature/*`: uma branch por funcionalidade, integrada à `develop` via Pull Request
- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (ex.: `feat(back): ...`)
