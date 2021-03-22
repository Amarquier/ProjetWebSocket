var ws = require("nodejs-websocket");

var server = ws.createServer(function(conn) {

    console.log("Nouvelle connexion");

    // Réception d'un message texte
    conn.on("text", function(msg) {
      console.log("Texte reçu : " + msg);
      if (msg == "hello") conn.sendText("Bonjour !");
      else if (msg == "date") conn.sendText(new Date().toString());
      else if (["bye", "ciao"].includes(msg)) {
          conn.sendText("Au revoir");
          conn.close();
      }
      else conn.sendText("Pas compris !");
    });

    // Fermeture de connexion
    conn.on("close", function(code, reason) {
        console.log("Connexion fermée");
    });

    // En cas d'erreur
    conn.on("error", function(err) {
      console.log(err);
    });

}).listen(8001); // On écoute sur le port 8001