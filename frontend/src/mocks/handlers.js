import { rest } from "msw";
import { projectsMock } from "@mocks/ProjectMock";
import { listServizi } from "@mocks/ServiziMock";
import { listCommesse } from "@mocks/CommesseMock";

// Mock degli utenti
const users = [
  { id: 1, name: "Mario Rossi", email: "mario.rossi@example.com" },
  { id: 2, name: "Luigi Bianchi", email: "luigi.bianchi@example.com" },
  { id: 3, name: "Anna Verdi", email: "anna.verdi@example.com" },
];

export const handlers = [
  // GET /users
  rest.get("/mock/users", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(users));
  }),

  // GET /users/:id
  rest.get("/mock/users/:id", (req, res, ctx) => {
    const { id } = req.params;
    const user = users.find((u) => u.id === parseInt(id));
    if (!user)
      return res(ctx.status(404), ctx.json({ message: "User not found" }));
    return res(ctx.status(200), ctx.json(user));
  }),

  // POST /users
  rest.post("/mock/users", async (req, res, ctx) => {
    const newUser = await req.json();
    newUser.id = users.length + 1;
    users.push(newUser);
    return res(ctx.status(201), ctx.json(newUser));
  }),

  // PUT /users/:id
  rest.put("/mock/users/:id", async (req, res, ctx) => {
    const { id } = req.params;
    const updatedUser = await req.json();
    const index = users.findIndex((u) => u.id === parseInt(id));
    if (index === -1)
      return res(ctx.status(404), ctx.json({ message: "User not found" }));
    users[index] = { ...users[index], ...updatedUser };
    return res(ctx.status(200), ctx.json(users[index]));
  }),

  // DELETE /users/:id
  rest.delete("/mock/users/:id", (req, res, ctx) => {
    const { id } = req.params;
    const index = users.findIndex((u) => u.id === parseInt(id));
    if (index === -1)
      return res(ctx.status(404), ctx.json({ message: "User not found" }));
    users.splice(index, 1);
    return res(ctx.status(204));
  }),

  rest.get("/mock/projects", (req, res, ctx) => {
    console.log("[MSW] handler called for /mock/projects ✅");
    return res(
      ctx.status(200),
      ctx.json(projectsMock)
    );
  }),

  rest.get("/mock/projects/:id", (req, res, ctx) => {
    const project = projectsMock.find((p) => p.id === parseInt(req.params.id));
    return project
      ? res(ctx.status(200), ctx.json(project))
      : res(ctx.status(404));
  }),

  // GET /mock/servizi - Lista servizi dal catalogo
  rest.get("/mock/servizi", async (req, res, ctx) => {
    try {
      const servizi = await listServizi();
      return res(ctx.status(200), ctx.json(servizi));
    } catch (error) {
      return res(
        ctx.status(500), 
        ctx.json({ message: "Errore nel caricamento servizi", error: error.message })
      );
    }
  }),

  // GET /mock/commesse - Lista commesse con filtro includeClosed opzionale
  rest.get("/mock/commesse", async (req, res, ctx) => {
    try {
      const includeClosed = req.url.searchParams.get('includeClosed') === 'true';
      const commesse = await listCommesse({ includeClosed });
      return res(ctx.status(200), ctx.json(commesse));
    } catch (error) {
      return res(
        ctx.status(500), 
        ctx.json({ message: "Errore nel caricamento commesse", error: error.message })
      );
    }
  }),
  
];
