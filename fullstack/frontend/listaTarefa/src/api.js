const BASE = "http://localhost:8080";

export async function listTasks() {
  const r = await fetch(`${BASE}/tasks/`);
  if (!r.ok) throw new Error("Falha ao listar");
  return r.json();
}

export async function createTask(task) {
  const r = await fetch(`${BASE}/tasks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!r.ok) throw new Error("Falha ao criar");
  return r.json(); // retorna com ID do back
}

export async function updateTask(id, patch) {
  const r = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("Falha ao atualizar");
  return r.json();
}

export async function deleteTask(id) {
  const r = await fetch(`${BASE}/tasks/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Falha ao deletar");
}
