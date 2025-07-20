import express from "express";
import cors from "cors";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());

const getDataFromFile = async (size) => {
  try {
    const filePath = path.join(__dirname, "data", `${size}.json`);
    const fileData = await readFile(filePath, "utf-8");
    return JSON.parse(fileData);
  } catch (err) {
    return { error: "File not found" };
  }
};

app.get("/data", async (req, res) => {
  const size = req.query.size;
  const format = req.query.format;

  const data = await getDataFromFile(size);

  if (format === "html") {
    res.render("posts", { users: data });
  } else if (format === "json") {
    res.json(data);
  } else {
    res.status(400).send("Invalid format");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
