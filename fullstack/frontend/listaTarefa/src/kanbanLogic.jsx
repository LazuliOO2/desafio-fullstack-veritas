// kanbanLogic.js
import { useState, useEffect } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { listTasks, createTask, updateTask, deleteTask } from "./api";

/* -------- Paleta de cores de tag -------- */
export const TAG_COLORS = [
  { name: "Cinza", value: "#e0e0e0", text: "#111" },
  { name: "Vermelho", value: "#e74c3c", text: "#fff" },
  { name: "Laranja", value: "#f39c12", text: "#fff" },
  { name: "Verde", value: "#27ae60", text: "#fff" },
  { name: "Azul", value: "#3498db", text: "#fff" },
  { name: "Roxo", value: "#8e44ad", text: "#fff" },
];

/*  Lógica de Nova Tarefa */
export function useNovaTarefa(onAdd) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [tagTitulo, setTagTitulo] = useState("");
  const [tagCor, setTagCor] = useState(TAG_COLORS[0]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!titulo.trim()) return;

    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      tag: {
        label: tagTitulo.trim() || "Tag",
        color: tagCor.value,
        text: tagCor.text,
      },
    });

    setTitulo("");
    setConteudo("");
    setTagTitulo("");
    setTagCor(TAG_COLORS[0]);
  }

  return {
    titulo,
    conteudo,
    tagTitulo,
    tagCor,
    setTitulo,
    setConteudo,
    setTagTitulo,
    setTagCor,
    handleSubmit,
  };
}

/*  Lógica de Edição */
export function useEditarTarefa(tarefa, onSave) {
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [conteudo, setConteudo] = useState(tarefa.conteudo || "");
  const [tagTitulo, setTagTitulo] = useState(tarefa.tag?.label || "");
  const [tagCor, setTagCor] = useState(
    TAG_COLORS.find((c) => c.value === tarefa.tag?.color) || TAG_COLORS[0]
  );

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...tarefa,
      titulo: titulo.trim() || tarefa.titulo,
      conteudo: conteudo.trim(),
      tag: {
        label: (tagTitulo || "Tag").trim(),
        color: tagCor.value,
        text: tagCor.text,
      },
    });
  }

  return {
    titulo,
    conteudo,
    tagTitulo,
    tagCor,
    setTitulo,
    setConteudo,
    setTagTitulo,
    setTagCor,
    handleSubmit,
  };
}

/*  Lógica de arrastar */
export function useSortableCard(tarefa) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return { attributes, listeners, setNodeRef, style };
}

/* Lógica da Coluna */
export function useColuna(colunaId) {
  const { setNodeRef, isOver } = useDroppable({ id: colunaId });
  const [abrirForm, setAbrirForm] = useState(false);

  return { setNodeRef, isOver, abrirForm, setAbrirForm };
}

/*  Lógica Principal (App) com persistência via API */
export function useKanban() {
  const [columns, setColumns] = useState({ todo: [], doing: [], done: [] });
  const [editing, setEditing] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columnOrder = ["todo", "doing", "done"];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const statusMap = { todo: "Pendente", doing: "Em andamento", done: "Concluída" };

  // 1) Carregar do servidor ao montar
  useEffect(() => {
    (async () => {
      const data = await listTasks();
      const next = { todo: [], doing: [], done: [] };
      for (const t of data) {
        const s = t.status || "todo";
        if (next[s]) next[s].push(t);
      }
      setColumns(next);
    })().catch(console.error);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults(null);
      return;
    }
    const found = [];
    for (const col of columnOrder) {
      for (const t of columns[col]) {
        if ((t.titulo || "").toLowerCase().includes(q)) {
          found.push({ titulo: t.titulo, status: statusMap[col] });
        }
      }
    }
    setResults(found);
  }

  function findContainer(id) {
    if (columnOrder.includes(id)) return id;
    return columnOrder.find((col) =>
      columns[col].some((t) => String(t.id) === String(id))
    );
  }

  // 2) Criar
  async function onAddItem(colunaId, novo) {
    // colunaId é a coluna onde o form está aberto; salva já com esse status
    const payload = {
      titulo: novo.titulo,
      conteudo: novo.conteudo,
      status: colunaId || "todo",
      tag: novo.tag ?? null,
    };
    const created = await createTask(payload);
    setColumns((prev) => ({
      ...prev,
      [created.status]: [created, ...prev[created.status]],
    }));
  }

  // 3) Remover
  async function onRemoveItem(colunaId, id) {
    await deleteTask(id);
    setColumns((prev) => ({
      ...prev,
      [colunaId]: prev[colunaId].filter((t) => t.id !== id),
    }));
  }

  // 4) Editar (título/conteúdo/tag)
  async function onEditItem(colunaId, novo) {
    const updated = await updateTask(novo.id, {
      titulo: novo.titulo,
      conteudo: novo.conteudo,
      tag: novo.tag ?? null,
      status: colunaId, // mantém na mesma coluna
    });
    setColumns((prev) => ({
      ...prev,
      [colunaId]: prev[colunaId].map((t) => (t.id === updated.id ? updated : t)),
    }));
  }

  // 5) Drag & Drop
  async function handleDragEnd({ active, over }) {
    if (!over) return;

    const fromCol = findContainer(active.id);
    const toCol = findContainer(over.id);
    if (!fromCol || !toCol) return;

    // Reordenação dentro da mesma coluna
    if (fromCol === toCol) {
      const oldIndex = columns[fromCol].findIndex(
        (t) => String(t.id) === String(active.id)
      );
      const overIndex = columns[toCol].findIndex(
        (t) => String(t.id) === String(over.id)
      );
      if (oldIndex < 0 || overIndex < 0) return;

      setColumns((prev) => ({
        ...prev,
        [fromCol]: arrayMove(prev[fromCol], oldIndex, overIndex),
      }));
      return;
    }

    // Move entre colunas + PATCH status no servidor
    const movingItem = columns[fromCol].find(
      (t) => String(t.id) === String(active.id)
    );
    if (!movingItem) return;

    // Otimista
    setColumns((prev) => {
      const fromList = prev[fromCol].filter((t) => t.id !== movingItem.id);
      const overIndex = prev[toCol].findIndex(
        (t) => String(t.id) === String(over.id)
      );
      const toList =
        overIndex >= 0
          ? [
              ...prev[toCol].slice(0, overIndex),
              movingItem,
              ...prev[toCol].slice(overIndex),
            ]
          : [...prev[toCol], movingItem];

      return { ...prev, [fromCol]: fromList, [toCol]: toList };
    });

    if (editing?.id === movingItem.id) setEditing(null);

    try {
      await updateTask(movingItem.id, { status: toCol });
    } catch (e) {
      console.error(e);
      // Aqui você poderia dar rollback se quiser sofrer um pouco mais.
    }
  }

  return {
    columns,
    setColumns,
    editing,
    setEditing,
    sensors,
    columnOrder,
    query,
    setQuery,
    results,
    setResults,
    handleSearch,
    onAddItem,
    onRemoveItem,
    onEditItem,
    handleDragEnd,
  };
}


