import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.56.102:30008",
});

export const getTasks = () => API.get("/tasks");

export const createTask = (title) =>
  API.post("/tasks", null, {
    params: { title },
  });

export const deleteTask = (id) =>
  API.delete(`/tasks/${id}`);