const express = require("express");
const path = require("path");
const { format } = require("date-fns");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running...");
    });
  } catch (e) {
    console.log(`Db error : ${e.message}`);
  }
};

initializeDbAndServer();

const convertDbObjToResObj = (dbObj) => {
  let dateList = dbObj.due_date.split("-");
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    category: dbObj.category,
    priority: dbObj.priority,
    status: dbObj.status,
    dueDate: format(
      new Date(dateList[0], dateList[1], dateList[2]),
      "yyyy-MM-dd"
    ),
  };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let query = "";
  switch (true) {
    case priority !== undefined && status !== undefined:
      query = `
            SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}' AND todo LIKE '%${search_q}%';`;
      break;
    case category !== undefined && status !== undefined:
      query = `
            SELECT * FROM todo WHERE category = '${category}' AND status = '${status}' AND todo LIKE '%${search_q}%';`;
      break;
    case category !== undefined && priority !== undefined:
      query = `
            SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}' AND todo LIKE '%${search_q}%';`;
      break;
    case status !== undefined:
      query = `SELECT * FROM todo WHERE status = '${status}' AND todo LIKE '%${search_q}%';`;
      break;
    case priority !== undefined:
      query = `SELECT * FROM todo WHERE priority = '${priority}' AND todo LIKE '%${search_q}%';`;
      break;
    case category !== undefined:
      query = `SELECT * FROM todo WHERE category = '${category}' AND todo LIKE '%${search_q}%';`;
      break;
    default:
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  let dbObj = await db.all(query);
  response.send(dbObj.map((each) => convertDbObjToResObj(each)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoByIdQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  let dbObj = await db.get(getTodoByIdQuery);
  response.send(convertDbObjToResObj(dbObj));
});

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  console.log(date);
  let dateList = date.split("-");
  console.log(dateList);
  let date2 = String(
    format(
      new Date(dateList[0], parseInt(dateList[1]) - 1, dateList[2]),
      "yyyy-MM-dd"
    )
  );
  console.log(date2);
  const getAllTodosByDateQuery = `
    SELECT * FROM todo WHERE due_date = '${date2}';`;
  let dbObj = await db.all(getAllTodosByDateQuery);
  response.send(dbObj.map((each) => convertDbObjToResObj(each)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(dueDate);
  //   date = new Date(dueDate);
  //   const newDate = `${date.getFullYear()}-${
  //     date.getMonth() + 1
  //   }-${date.getDate()}`;
  //   console.log(newDate);
  const insertNewTodo = `
    INSERT INTO
    todo (id, todo, priority, status, category, due_date)
    VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate});`;
  await db.run(insertNewTodo);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
