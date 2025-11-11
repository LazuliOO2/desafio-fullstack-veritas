// App.jsx
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// importa a lógica extraída
import {
  TAG_COLORS,
  useNovaTarefa,
  useEditarTarefa,
  useSortableCard,
  useColuna,
  useKanban,
} from "./kanbanLogic";

// Formulário: Nova tarefa (apresentação)
function NovaTarefaForm({ onCancel, onAdd }) {
  const {
    titulo,
    conteudo,
    tagTitulo,
    tagCor,
    setTitulo,
    setConteudo,
    setTagTitulo,
    setTagCor,
    handleSubmit,
  } = useNovaTarefa(onAdd);

  return (
    <form className="card card-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Título</label>
        <input
          type="text"
          placeholder="Ex.: Redesign do site"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>Conteúdo</label>
        <textarea
          rows={3}
          placeholder="Ex.: Todas as equipes"
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
        />
      </div>

      <div className="form-row tag-row">
        <div className="tag-left">
          <label>Tag</label>
          <input
            type="text"
            placeholder="Ex.: Relatório"
            value={tagTitulo}
            onChange={(e) => setTagTitulo(e.target.value)}
          />
        </div>

        <div className="tag-right">
          <label>Cor</label>
          <select
            value={tagCor.value}
            onChange={(e) =>
              setTagCor(
                TAG_COLORS.find((c) => c.value === e.target.value) ?? TAG_COLORS[0]
              )
            }
          >
            {TAG_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.name}
              </option>
            ))}
          </select>

          <span
            className="tag preview"
            style={{ backgroundColor: tagCor.value, color: tagCor.text }}
          >
            {tagTitulo || "Tag"}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Adicionar
        </button>
      </div>
    </form>
  );
}

/* Formulário: Editar tarefa (apresentação)  */
function EditCardForm({ tarefa, onCancel, onSave }) {
  const {
    titulo,
    conteudo,
    tagTitulo,
    tagCor,
    setTitulo,
    setConteudo,
    setTagTitulo,
    setTagCor,
    handleSubmit,
  } = useEditarTarefa(tarefa, onSave);

  return (
    <form className="card card-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Título</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <label>Conteúdo</label>
        <textarea
          rows={3}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
        />
      </div>

      <div className="form-row tag-row">
        <div className="tag-left">
          <label>Tag</label>
          <input
            value={tagTitulo}
            onChange={(e) => setTagTitulo(e.target.value)}
          />
        </div>
        <div className="tag-right">
          <label>Cor</label>
          <select
            value={tagCor.value}
            onChange={(e) =>
              setTagCor(
                TAG_COLORS.find((c) => c.value === e.target.value) ?? TAG_COLORS[0]
              )
            }
          >
            {TAG_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.name}
              </option>
            ))}
          </select>
          <span
            className="tag preview"
            style={{ backgroundColor: tagCor.value, color: tagCor.text }}
          >
            {tagTitulo || "Tag"}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Salvar
        </button>
      </div>
    </form>
  );
}

/*  Card arrastável (apresentação) */
function SortableCard({ tarefa, onRemove, onClick }) {
  const { attributes, listeners, setNodeRef, style } = useSortableCard(tarefa);

  return (
    <div className="card" ref={setNodeRef} style={style} {...attributes}>
      <div className="card-head" {...listeners} title="Arraste para mover">
        <h4
          className="card-title"
          onClick={onClick}
          style={{ cursor: "pointer" }}
        >
          {tarefa.titulo}
        </h4>
        <button
          aria-label="Excluir tarefa"
          className="btn-close"
          onClick={onRemove}
          title="Excluir"
        >
          ×
        </button>
      </div>

      {tarefa.conteudo && (
        <p onClick={onClick} style={{ cursor: "pointer" }}>
          {tarefa.conteudo}
        </p>
      )}

      {tarefa.tag && (
        <span
          className="tag"
          style={{
            backgroundColor: tarefa.tag.color,
            color: tarefa.tag.text || "#111",
          }}
        >
          {tarefa.tag.label}
        </span>
      )}
    </div>
  );
}

/*  Coluna (apresentação)  */
function Coluna({
  colunaId,
  titulo,
  items,
  onAddItem,
  onRemoveItem,
  onEditItem,
  editing,
  setEditing,
}) {
  const { setNodeRef, isOver, abrirForm, setAbrirForm } = useColuna(colunaId);

  return (
    <div className="coluna" data-column={colunaId}>
      <h3>{titulo}</h3>

      <div ref={setNodeRef} className={`dropzone ${isOver ? "is-over" : ""}`}>
        <SortableContext
          items={items.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((t) =>
            editing?.id === t.id && editing?.colunaId === colunaId ? (
              <EditCardForm
                key={t.id}
                tarefa={t}
                onCancel={() => setEditing(null)}
                onSave={(novo) => {
                  onEditItem(colunaId, novo);
                  setEditing(null);
                }}
              />
            ) : (
              <SortableCard
                key={t.id}
                tarefa={t}
                onRemove={() => onRemoveItem(colunaId, t.id)}
                onClick={() => setEditing({ id: t.id, colunaId })}
              />
            )
          )}
        </SortableContext>
      </div>

      {abrirForm ? (
        <NovaTarefaForm
          onCancel={() => setAbrirForm(false)}
          onAdd={(novo) => {
            onAddItem(colunaId, novo);
            setAbrirForm(false);
          }}
        />
      ) : (
        <button className="btn-add" onClick={() => setAbrirForm(true)}>
          + Adicionar tarefa
        </button>
      )}
    </div>
  );
}

/*  App (Kanban + Busca) */
export default function App() {
  const {
    columns,
    editing,
    setEditing,
    sensors,
    columnOrder,
    query,
    setQuery,
    results,
    handleSearch,
    onAddItem,
    onRemoveItem,
    onEditItem,
    handleDragEnd,
  } = useKanban();

  return (
    <>
      <header className="header">
        <form className="barra-pesquisa" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tarefas de pesquisa, etiquetas e usuários"
            aria-label="Buscar tarefas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn-search" type="submit" aria-label="Buscar">
            🔍
          </button>
        </form>

        <button
          id="TarefaHeader"
          type="button"
          onClick={() => {
            const btn = document.querySelector(".coluna .btn-add");
            btn?.click();
          }}
        >
          + Nova Tarefa
        </button>
      </header>

      {results !== null && (
        <div className="search-result">
          {results.length > 0 ? (
            <>
              <strong>Resultados ({results.length}):</strong>
              <ul>
                {results.map((r, i) => (
                  <li key={i}>
                    <span className="sr-title">{r.titulo}</span>
                    <span
                      className={`sr-badge ${
                        r.status === "Pendente"
                          ? "sr-pendente"
                          : r.status === "Em andamento"
                          ? "sr-andamento"
                          : "sr-concluida"
                      }`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <em>Nenhuma tarefa encontrada para “{query}”.</em>
          )}
        </div>
      )}

      <h1 id="titulo">Tarefas do Projeto</h1>
      <hr className="linha" />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban">
          <SortableContext
            items={columnOrder}
            strategy={verticalListSortingStrategy}
          >
            <Coluna
              colunaId="todo"
              titulo="Pendência"
              items={columns.todo}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onEditItem={onEditItem}
              editing={editing}
              setEditing={setEditing}
            />

            <Coluna
              colunaId="doing"
              titulo="Em andamento"
              items={columns.doing}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onEditItem={onEditItem}
              editing={editing}
              setEditing={setEditing}
            />

            <Coluna
              colunaId="done"
              titulo="Concluído"
              items={columns.done}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onEditItem={onEditItem}
              editing={editing}
              setEditing={setEditing}
            />
          </SortableContext>
        </div>
      </DndContext>
    </>
  );
}




