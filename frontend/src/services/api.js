import axios from "axios";

const API = axios.create({
  baseURL: "http://backend:8000",
});

export const getTasks = () => API.get("/tasks");

export const createTask = (title) =>
  API.post("/tasks", null, {
    params: { title },
  });

export const deleteTask = (id) =>
  API.delete(`/tasks/${id}`);