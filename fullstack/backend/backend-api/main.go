package main

import (
	"encoding/json" // Para codificar e decodificar JSON
	"errors"
	"log"      // Para registrar logs no console
	"net/http" // O pacote principal para HTTP
	"os"
	"strconv" // Para converter o ID da URL (string) para int
	"sync"
	"time" // Usado pelo middleware de CORS

	"github.com/go-chi/chi/v5" // O nosso roteador (mux)
	"github.com/go-chi/cors"   // O middleware de CORS
)

type Tag struct {
	Label string `json:"label"`
	Color string `json:"color"`
	Text  string `json:"text"`
}

// Estrutura
type Task struct {
	ID       int    `json:"id"`
	Titulo   string `json:"titulo"`
	Conteudo string `json:"conteudo"`
	Status   string `json:"status"` // "todo", "doing", "done"
	Tag      *Tag   `json:"tag,omitempty"`
}

type PatchTask struct {
	Titulo   *string `json:"titulo"`
	Conteudo *string `json:"conteudo"`
	Status   *string `json:"status"`
	Tag      *Tag    `json:"tag"`
}

// Armazenar o banco de dados
type dbSnapshot struct {
	NextID int    `json:"next_id"`
	Tasks  []Task `json:"tasks"`
}

var (
	tasks  []Task
	nextID = 1

	dbFile = "data.json" // mude o caminho se quiser

	mu sync.Mutex
)

// persistencia
func loadFromDisk() error {
	f, err := os.Open(dbFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// primeira execução: nada a carregar
			return nil
		}
		return err
	}
	defer f.Close()

	var snap dbSnapshot
	if err := json.NewDecoder(f).Decode(&snap); err != nil {
		return err
	}

	tasks = snap.Tasks
	if snap.NextID > 0 {
		nextID = snap.NextID
	} else {
		// fallback: calcula a partir das tasks
		maxID := 0
		for _, t := range tasks {
			if t.ID > maxID {
				maxID = t.ID
			}
		}
		nextID = maxID + 1
	}
	return nil
}

func saveToDisk() error {
	// escreve em arquivo temporário e faz rename atômico
	tmp := dbFile + ".tmp"

	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(dbSnapshot{NextID: nextID, Tasks: tasks}); err != nil {
		f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(tmp, dbFile)
}

// Rotas
// função que receber a resposta do servidor w e requisição do cliente
func getTasks(w http.ResponseWriter, r *http.Request) {
	// Pegamos o cabecario da resposta e definimos ele com ""Content-Type", "application/json""
	w.Header().Set("Content-Type", "application/json")
	mu.Lock()
	defer mu.Unlock()

	if tasks == nil {
		tasks = []Task{}
	}
	// json.NewEncoder(w) cria um encoder JSON que escreve direto na saída w e .Encode(tasks)  traduz e manda o resultado pro navegador porque o html precisa do texto puro
	// ? json.NewEncoder → traduz de Go para JSON
	json.NewEncoder(w).Encode(tasks)
}

func getTaskByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()
	for _, t := range tasks {
		if t.ID == id {
			json.NewEncoder(w).Encode(t)
			return
		}
	}
	http.Error(w, "Tarefa não encontrada", http.StatusNotFound)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var novaTarefa Task

	// ? json.NewDecoder → traduz de JSON para Go
	// nil seria vazio ou seja se o erro não estive vazio
	if err := json.NewDecoder(r.Body).Decode(&novaTarefa); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// validação
	if len(novaTarefa.Titulo) == 0 {
		http.Error(w, "O título é obrigatório", http.StatusBadRequest)
		return
	}

	//  Atribuir ID, Status padrão e salvar
	mu.Lock()
	novaTarefa.ID = nextID
	nextID++
	if novaTarefa.Status == "" {
		novaTarefa.Status = "todo"
	}
	tasks = append(tasks, novaTarefa)
	if err := saveToDisk(); err != nil {
		// se falhar salvar, desfaz a inserção para não criar estado fantasma
		tasks = tasks[:len(tasks)-1]
		nextID--
		mu.Unlock()
		log.Println("Erro ao salvar no disco:", err)
		http.Error(w, "Falha ao persistir", http.StatusInternalServerError)
		return
	}
	mu.Unlock()

	//  Responder com 201 Created e a tarefa criada
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(novaTarefa)
}

func updateTask(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	var patch PatchTask
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields() // pega typos no JSON
	if err := dec.Decode(&patch); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	idx := -1
	for i, t := range tasks {
		if t.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		http.Error(w, "Tarefa não encontrada", http.StatusNotFound)
		return
	}

	// aplica atualização parcial
	if patch.Titulo != nil {
		tasks[idx].Titulo = *patch.Titulo
	}
	if patch.Conteudo != nil {
		// permite limpar quando vier ""
		tasks[idx].Conteudo = *patch.Conteudo
	}
	if patch.Status != nil {
		s := *patch.Status
		switch s {
		case "todo", "doing", "done":
			tasks[idx].Status = s
		default:
			http.Error(w, "Status inválido (use: todo, doing, done)", http.StatusBadRequest)
			return
		}
	}
	if patch.Tag != nil {
		// se quiser remover a tag, mande "tag": null no JSON
		tasks[idx].Tag = patch.Tag
	}

	if err := saveToDisk(); err != nil {
		log.Println("Erro ao salvar no disco:", err)
		http.Error(w, "Falha ao persistir", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(tasks[idx])
}

// --- DELETE /tasks/{id} ---
// Remove uma tarefa
func deleteTask(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	mu.Lock()
	idx := -1
	for i, t := range tasks {
		if t.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		mu.Unlock()
		http.Error(w, "Tarefa não encontrada", http.StatusNotFound)
		return
	}

	// remove
	tasks = append(tasks[:idx], tasks[idx+1:]...)
	if err := saveToDisk(); err != nil {
		mu.Unlock()
		log.Println("Erro ao salvar no disco:", err)
		http.Error(w, "Falha ao persistir", http.StatusInternalServerError)
		return
	}
	mu.Unlock()

	w.WriteHeader(http.StatusNoContent)
}

// 4. A FUNÇÃO PRINCIPAL (MAIN)
// Configura o roteador, o CORS e inicia o servidor.
func main() {
	// carrega o snapshot antes de subir servidor
	if err := loadFromDisk(); err != nil {
		log.Fatalf("Falha ao carregar %s: %v", dbFile, err)
	}

	// Inicializa o roteador Chi
	r := chi.NewRouter()

	// Configuração do CORS
	// Este middleware adiciona os cabeçalhos de CORS
	// em *todas* as respostas.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173"}, // Permite apenas o front local
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
		MaxAge:         int(time.Minute.Seconds()), // MaxAge define por quanto tempo o navegador pode lembrar dessa resposta e não precisar perguntar de novo.
	}))

	// 5. DEFINIÇÃO DAS ROTAS
	// Agrupamos todas as rotas que começam com /tasks
	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", getTasks)          // GET /tasks - Lista todas
		r.Get("/{id}", getTaskByID)   // GET /tasks - pegar um item
		r.Post("/", createTask)       // POST /tasks - Cria uma
		r.Put("/{id}", updateTask)    // PUT /tasks/1 - Atualiza a tarefa 1
		r.Delete("/{id}", deleteTask) // DELETE /tasks/1 - Deleta a tarefa 1
	})

	// Inicia o servidor na porta 8080
	log.Println("Servidor rodando em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
