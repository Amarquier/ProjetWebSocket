const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const path = require("path");
const db_name = path.join(__dirname, "data", "apptest.db");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');

const sql_create = [`CREATE TABLE IF NOT EXISTS Livres (
  Livre_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Titre VARCHAR(100) NOT NULL,
  Auteur VARCHAR(100) NOT NULL,
  Commentaires TEXT
);
`,`
CREATE TABLE IF NOT EXISTS Utilisateur(
   nomUtilisateur VARCHAR(50),
   PRIMARY KEY(nomUtilisateur)
);
`,`
CREATE TABLE IF NOT EXISTS Creneau(
   idcreneau INTEGER,
   dateCreneau DATE NOT NULL,
   livre_ID INT NOT NULL,
   PRIMARY KEY(idcreneau),
   FOREIGN KEY(livre_ID) REFERENCES Livres(livre_ID)
);

`,`
CREATE TABLE IF NOT EXISTS Discuter(
   livre_ID INT,
   nomUtilisateur VARCHAR(50),
   idcreneau INT,
   dateDiscussion DATE,
   PRIMARY KEY(livre_ID, nomUtilisateur, idcreneau),
   FOREIGN KEY(livre_ID) REFERENCES Livres(livre_ID),
   FOREIGN KEY(nomUtilisateur) REFERENCES Utilisateur(nomUtilisateur),
   FOREIGN KEY(idcreneau) REFERENCES Creneau(idcreneau)
);
`,`
CREATE TABLE IF NOT EXISTS posséder(
   nomUtilisateur VARCHAR(50),
   idcreneau INT,
   PRIMARY KEY(nomUtilisateur, idcreneau),
   FOREIGN KEY(nomUtilisateur) REFERENCES Utilisateur(nomUtilisateur),
   FOREIGN KEY(idcreneau) REFERENCES Creneau(idcreneau)
);
`,`
CREATE TABLE IF NOT EXISTS Aimer(
   livre_ID INT,
   nomUtilisateur VARCHAR(50),
   PRIMARY KEY(livre_ID, nomUtilisateur),
   FOREIGN KEY(livre_ID) REFERENCES Livres(livre_ID),
   FOREIGN KEY(nomUtilisateur) REFERENCES Utilisateur(nomUtilisateur)
);
`];

const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données 'apptest.db'");
});
for (let i = 0; i < sql_create.length; i++) {
  db.run(sql_create[i], err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Création réussie de la table "+i);
  
  if (sql_create[i].includes(`CREATE TABLE IF NOT EXISTS Livres`))
  {
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
  }
  
});
}
  
  // const sql_insert_2 = `INSERT INTO Discuter (Livre_ID, nomUtilisateur, dateDiscussion) VALUES
  // (1, 'toto', now()),
  // (2, 'titi', now()),
  // (3, 'tata', now());`;
  
  // db.run(sql_insert_2, err => {
    // if (err) {
      // return console.error(err.message);
    // }
    // console.log("Alimentation réussie de la table 'Livres'");
  // });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(session({secret: "labandeabader"}));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.locals.users = [];
app.locals.messages = [];

app.get("/", (req, res) => {
    if(!req.session.pseudo){
        res.render("login");
    } else {
	var pseudo = req.session.pseudo
    res.render("index", {model: pseudo});
    }
});

app.post("/goodlogin", (req, res) => {
    
    // creer la session à partir
    req.session.pseudo = req.body.pseudo;
    var pseudo = req.body.pseudo;
    // créer l'utilisateur s'il n'existe pas déjà
    const sql = "SELECT nomUtilisateur FROM Utilisateur where nomUtilisateur='"+pseudo+"'";
    db.all(sql, [], (err, pseudo) => {
        if (err) {
            return console.error(err.message);
        }
        if(pseudo.length == 0) {
            const sql2 = "INSERT INTO Utilisateur (nomUtilisateur) VALUES ('"+req.body.pseudo+"')"; 

            console.log(sql2);
            db.run(sql2, [], err => {
                if (err) {
                    return console.error(err.message);
                }
            });
        }
    });
    res.render("index", {model : pseudo});
});

app.get("/about", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
	res.render("about");
	}
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/data", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const sql = "SELECT nomUtilisateur, dateDiscussion, Titre FROM Discuter, Livres WHERE Livres.Livre_ID=Discuter.livre_ID GROUP BY idcreneau";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
	// console.log(rows);
	var pseudo = req.session.pseudo;
    res.render("data", { model: rows, pseudo });
  });
	}
});

app.get("/livres", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const sql = "SELECT * FROM Livres ORDER BY Titre";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("livres", { model: rows });
  });
	}
});

app.get('/chat', (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  var user = req.session.pseudo;

  const users = app.locals.users.filter(u => u !== user);
  res.render('chat', { user, users, messages: app.locals.messages });
	}
})

// GET /edit/5
app.get("/edit/:id", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("edit", { model: row });
  });
	}
});

app.get("/discuss/:id", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
	var pseudo = req.session.pseudo;

    res.render("discuss", { model : row, pseudo });
  });
	}
});

// POST /edit/5
app.post("/edit/:id", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const id = req.params.id;
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires, id];
  const sql = "UPDATE Livres SET Titre = ?, Auteur = ?, Commentaires = ? WHERE (Livre_ID = ?)";
  db.run(sql, book, err => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect("/livres");
  });
	}
});

app.post("/discuss/:id", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {  
	const id = req.params.id;
  	
	console.log("nomuser : "+req.body.nomUtilisateur);
	console.log("date : "+req.body.dateDiscussion);
	console.log("id : "+id);
	const nomUtilisateur=req.body.nomUtilisateur;
	const dateDiscussion=req.body.dateDiscussion;

	const sql2 = "INSERT INTO Creneau (dateCreneau, Livre_ID) VALUES ('"+dateDiscussion+"','"+id+"');";
	console.log(sql2);
		db.run(sql2, err => {
		if (err) {
		  return console.error(err.message);
		}
		else(
		console.log("INSERT INTO Creneau (dateCreneau, Livre_ID) VALUES ('"+dateDiscussion+"','"+id+"')")
		)


    const sql0 = "SELECT MAX(idcreneau) as max FROM Creneau";
    db.all(sql0, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
	console.log(rows[0].max);
	var idcren = rows[0].max;
	console.log ("MAX = "+idcren);
	
		// res.redirect("/data");
		const book = [id, req.body.nomUtilisateur, req.body.dateDiscussion];
		const sql = "INSERT INTO Discuter (Livre_ID, nomUtilisateur, dateDiscussion, idcreneau) VALUES (?, ?, ?,'"+idcren+"') ;";
			db.run(sql, book, err => {
				if (err) {
				  return console.error(err.message);
				}
				res.redirect("/data");
				
				const sql3 = "SELECT idcreneau FROM Discuter WHERE dateDiscussion = '"+dateDiscussion+"' AND Livre_ID = "+id+" AND idcreneau <> "+idcren+";";
				db.all(sql3, [], (err, rows) => {
					if (err) {
					  return console.error(err.message);
					}
					console.log(rows);
					console.log(rows.length);
					if (rows.length>=1)
						{ 
							// console.log("envoyer la notification")
							console.log(" id déja existant est le "+rows[0].idcreneau);
							//changer le nouvel id de Discussion
							const sql4 = "UPDATE Discuter SET idcreneau='"+rows[0].idcreneau+"' WHERE nomUtilisateur = '"+nomUtilisateur+"' AND Livre_ID = '"+id+"' AND dateDiscussion = '"+dateDiscussion+"'";
								db.run(sql4, err => {
								// if (err) ...
								});
							//supprimer l'ancien créneau
							const sql5 = "DELETE FROM  Creneau WHERE idcreneau = '"+idcren+"'";
								db.run(sql5, err => {
								// if (err) ...
								});
							
						}
				});
			
			});
		});
	});
	}
});

// GET /create
app.get("/create", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  res.render("create", { model: {} });
	}
});

// POST /create
app.post("/create", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const sql = "INSERT INTO Livres (Titre, Auteur, Commentaires) VALUES (?, ?, ?)";
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires];
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/livres");
  });
	}
});

// GET /delete/5
app.get("/delete/:id", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("delete", { model: row });
  });
	}
});

// POST /delete/5
app.post("/delete/:id", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
  const id = req.params.id;
  const sql = "DELETE FROM Livres WHERE Livre_ID = ?";
  db.run(sql, id, err => {
    // if (err) ...
    res.redirect("/livres");
  });
	}
});

app.get("/join", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
	res.render("join");
	}
});

app.get("/cancel", (req, res) => {
	    if(!req.session.pseudo){
        res.render("login");
    } else {
        var model = {
            pseudo : req.session.pseudo
    };
	res.render("cancel");
	}
});

io.on('connection', socket => {
  let login;

  socket.on('login', data => {
    const user = data.user;
    app.locals.users.push(user);
    login = user;

    socket.broadcast.emit('user-connected', { user: login });
    console.log('connected: ', login)
  });

  socket.on('disconnect', () => {
    console.log("Disconnected: ", login);
    app.locals.users.splice(app.locals.users.indexOf(login), 1);
    io.emit('user-disconnected', { user: login });
  });

  socket.on('new-message', msg => {
    app.locals.messages.push(msg);
    io.emit('new-message', msg);
  });
});

http.listen(3000, () => console.log('listening on *:3000'));
