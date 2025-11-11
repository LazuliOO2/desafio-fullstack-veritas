
# 🗂 Projeto Kanban Interativo

Este projeto foi desenvolvido como um **sistema Kanban completo**, integrando **frontend em React** com **backend em Go (Golang)**.  
O objetivo é permitir o gerenciamento de tarefas com **adição, edição, exclusão e movimentação entre colunas**, tudo com **persistência em disco** e comunicação via **API REST**.

Inclui recursos de **busca**, **tags coloridas**, **arrastar e soltar (drag & drop)** e **edição em tempo real**, garantindo uma experiência fluida e intuitiva.

---

## 📊 Diagrama de Fluxo do Aplicativo

O diagrama abaixo mostra o fluxo principal do app, desde o carregamento das tarefas até as ações do usuário:

![Fluxo do App](https://github.com/LazuliOO2/desafio-fullstack-veritas/blob/main/fullstack/docs/user-flow.png)


---

## ⚙️ Estrutura do Projeto

### 🧠 Lógica (Frontend)

- **`kanbanLogic.jsx`**  
  Contém toda a lógica reutilizável e organizada em *hooks* customizados:
  - `useKanban`: lógica principal do quadro, comunicação com API e drag & drop.
  - `useNovaTarefa` e `useEditarTarefa`: formulários de criação e edição.
  - `useColuna` e `useSortableCard`: manipulação das colunas e cartões arrastáveis.

- **`api.js`**  
  Define as funções de integração com o backend Go:
  - `listTasks()` → Lista todas as tarefas  
  - `createTask()` → Cria nova tarefa  
  - `updateTask()` → Atualiza uma tarefa existente  
  - `deleteTask()` → Remove tarefa pelo ID  

---

### 🖼 Interface (Frontend)

- **`App.jsx`**  
  Implementa o layout completo do Kanban, dividido em:
  - Cabeçalho com **campo de busca** e botão **“Nova Tarefa”**  
  - Três colunas: **Pendência**, **Em andamento**, **Concluído**  
  - Suporte a **arrastar e soltar (DndKit)**  
  - Edição inline de tarefas e atualização automática  

- **`App.css`**  
  Define toda a estilização visual:
  - Layout do **header**, colunas, cards e botões  
  - Estilo das **tags coloridas** e feedback visual do drag & drop  
  - Aparência do campo de busca e resultados  

---

### 🖥 Backend (Go)

- **`main.go`**  
  Implementa uma **API RESTful** usando `chi` e `cors`, com persistência em arquivo `data.json`.  
  Rotas disponíveis:
  - `GET /tasks` → Lista todas as tarefas  
  - `GET /tasks/{id}` → Retorna uma tarefa específica  
  - `POST /tasks` → Cria nova tarefa  
  - `PUT /tasks/{id}` → Atualiza título, conteúdo, status ou tag  
  - `DELETE /tasks/{id}` → Remove tarefa existente  

  Inclui controle de concorrência com **mutex**, gravação segura em disco e verificação de erros.  
  Todas as rotas foram **testadas utilizando o Insomnia**, garantindo o correto funcionamento da API.

---

## 🚀 Destaques e Aprendizados

- **Frontend moderno com React + DndKit**: interface reativa e arrastável.  
- **Backend em Go com persistência local**: desempenho e confiabilidade.  
- **Arquitetura modular**: separação entre lógica, apresentação e persistência.  
- **Busca dinâmica**: permite filtrar tarefas por título e visualizar o status.  
- **Tags coloridas**: identificação visual e personalização rápida.  
- **Design responsivo e limpo** com CSS personalizado.

---

## 🌐 Funcionamento

1. Inicie o servidor Go:
   ```bash
   go run main.go
   ```
   O servidor rodará em **http://localhost:8080**

2. Inicie o frontend React:
   ```bash
   npm run dev
   ```
   O projeto abrirá em **http://localhost:5173**

> O backend já está configurado com CORS para permitir apenas o front local.

---

## 📂 Estrutura Completa

```
📦 FULLSTACK
├── 📁 backend
│   └── 📁 backend-api
│       ├── 📄 data.json              → Banco de dados simples (JSON)
│       ├── 📄 go.mod                 → Dependências do módulo Go
│       ├── 📄 go.sum                 → Checksums das dependências Go
│       └── 📄 main.go                → Servidor Go (API REST + persistência)
│
├── 📁 docs
│   └── 📄 user-flow.png              → Diagrama de fluxo do usuário
│
├── 📁 frontend
│   └── 📁 listaTarefa
│       ├── 📁 node_modules           → Dependências do frontend
│       ├── 📁 src
│       │   ├── 📄 api.js            → Comunicação com o backend
│       │   ├── 📄 App.css           → Estilo global e layout Kanban
│       │   ├── 📄 App.jsx           → Componente principal React
│       │   ├── 📄 kanbanLogic.jsx   → Lógica e hooks principais do Kanban
│       │   └── 📄 main.jsx          → Ponto de entrada React/Vite
│       │
│       ├── 📄 .gitignore            → Arquivos ignorados pelo Git
│       ├── 📄 eslint.config.js      → Configuração de linting
│       ├── 📄 index.html            → HTML principal do Vite
│       ├── 📄 package.json          → Dependências e scripts do projeto
│       ├── 📄 package-lock.json     → Lockfile do npm
│       ├── 📄 README.md             → Documentação do frontend
│       └── 📄 vite.config.js        → Configuração do Vite

```

---

## 🧩 Tecnologias Utilizadas

- **Frontend**: React + DnD Kit  
- **Backend**: Go + Chi + CORS  
- **Persistência**: JSON local (simulando banco de dados)  
- **Estilo**: CSS puro (Poppins, flexbox e responsividade)  
- **Testes de API**: Insomnia  

---

## 📌 Contribuição

Contribuições são bem-vindas!  
Abra uma **Issue** ou envie um **Pull Request** com sugestões de melhorias, correções ou novos recursos.

---

## 📜 Licença

Este projeto está sob a licença MIT.  
Sinta-se livre para estudar, modificar e utilizar como base para seus próprios projetos.
