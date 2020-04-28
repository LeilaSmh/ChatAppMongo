const MongoClient = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connexion à la base de donnée MongoDB
MongoClient.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('Database Created Successfully...');

    // Se Connecter à Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Envoyer le statut au serveur
        setStatus = function(s){
            socket.emit('status', s);
        }

        // Accéder aux messages
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }
            socket.emit('output', res);
        });

        // Les messages d'entrées
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Vérifier si le nom ou le message sont vides
            if(name == '' || message == ''){
                setStatus('Veuillez entrer un nom et un message');
            } else {
                // Insérer le message dans la base de données
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Renvoyer le statut 
                    setStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Gérer clear
        socket.on('clear', function(data){
            // Supprimer tous les messages de la collection
            chat.remove({}, function(){
                socket.emit('cleared');
            });
        });
    });
});