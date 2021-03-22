const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const path = require("path");
const db_name = path.join(__dirname, "data", "apptest.db");

const sql_create_L = `CREATE TABLE IF NOT EXISTS Livres (
  Livre_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Titre VARCHAR(100) NOT NULL,
  Auteur VARCHAR(100) NOT NULL,
  Commentaires TEXT
);`;

const sql_create_U = `CREATE TABLE IF NOT EXISTS Utilisateur(
   nomUtilisateur VARCHAR(50),
   PRIMARY KEY(nomUtilisateur)
);`;

const sql_create_D = `CREATE TABLE IF NOT EXISTS Discuter(
   livre_ID INT,
   nomUtilisateur VARCHAR(50),
   dateDiscussion DATE,
   PRIMARY KEY(livre_ID, nomUtilisateur),
   FOREIGN KEY(livre_ID) REFERENCES Livre(livre_ID),
   FOREIGN KEY(nomUtilisateur) REFERENCES Utilisateur(nomUtilisateur)
);`;

const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données 'apptest.db'");
});

db.run(sql_create_L, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Création réussie de la table 'Livres'");
});

db.run(sql_create_U, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Création réussie de la table 'Utilisateur'");
});

db.run(sql_create_D, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Création réussie de la table 'Discuter'");
});

// Alimentation de la table
  const sql_insert = `INSERT INTO Livres (Livre_ID, Titre, Auteur, Commentaires) VALUES
  (1, 'Mrs. Bridge', 'Evan S. Connell', 'Premier de la série'),
  (2, 'Mr. Bridge', 'Evan S. Connell', 'Second de la série'),
  (3, 'L''ingénue libertine', 'Colette', 'Minne + Les égarements de Minne');`;
  db.run(sql_insert, err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Alimentation réussie de la table 'Livres'");
  });
  
  const sql_insert_2 = `INSERT INTO Discuter (Livre_ID, nomUtilisateur, dateDiscussion) VALUES
  (1, 'toto', now()),
  (2, 'titi', now()),
  (3, 'tata', now());`;
  
  db.run(sql_insert_2, err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Alimentation réussie de la table 'Livres'");
  });


app.listen(3000, () => {
  console.log("Serveur démarré (http://localhost:3000/) !");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  // res.send("Bonjour le monde...");
  res.render("index");
});

app.get("/", (req, res) => {
  res.send("Bonjour le monde...");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/data", (req, res) => {
  const sql = "SELECT * FROM Discuter ORDER BY dateDiscussion";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("data", { model: rows });
  });
});

app.get("/livres", (req, res) => {
  const sql = "SELECT * FROM Livres ORDER BY Titre";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("livres", { model: rows });
  });
});

app.get("/chat", (req, res) => {
  res.render("chat");
});

// GET /edit/5
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("edit", { model: row });
  });
});

app.get("/discuss/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("discuss", { model: row });
  });
});

// POST /edit/5
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires, id];
  const sql = "UPDATE Livres SET Titre = ?, Auteur = ?, Commentaires = ? WHERE (Livre_ID = ?)";
  db.run(sql, book, err => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect("/livres");
  });
});

app.post("/discuss/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires, id];
  const sql = "INSERT INTO Discussion livre_ID = ?, nomUtilisateur = ?, dateDiscussion = ? ;";
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/discuss");
  });
});

// Configuration du serveur
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false })); // <--- paramétrage du middleware

// GET /create
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res) => {
  const sql = "INSERT INTO Livres (Titre, Auteur, Commentaires) VALUES (?, ?, ?)";
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires];
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});

// GET /delete/5
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("delete", { model: row });
  });
});

// POST /delete/5
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM Livres WHERE Livre_ID = ?";
  db.run(sql, id, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});