// const express = require("express");
// const app = express();

// app.use(express.static("public")); // static files

// const PORT = process.env.PORT || 8080;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require("express");
const http = require("http");          // <- add this
const socketio = require("socket.io"); // <- move this up

const app = express();

app.use(express.static("public")); // static files

const PORT = process.env.PORT || 8080;

// ✅ create HTTP server from express app
const server = http.createServer(app);

// ✅ attach socket.io to that server
const io = socketio(server);

// ✅ listen using the HTTP server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/home.html");
});


const arr = [

    {
        "name": "Cabbage",
        "url": "https://www.freepngimg.com/thumb/categories/2970.png"
    },
    {
        "name": "Tomato",
        "url": "https://media.istockphoto.com/id/1450576005/photo/tomato-isolated-tomato-on-white-background-perfect-retouched-tomatoe-side-view-with-clipping.jpg?s=612x612&w=0&k=20&c=lkQa_rpaKpc-ELRRGobYVJH-eMJ0ew9BckCqavkSTA0="
    },
    {
        "name": "Brocolli",
        "url": "https://media.istockphoto.com/id/1135308302/photo/broccoli-on-white.jpg?s=612x612&w=0&k=20&c=ONhL9A0yMth8m-83Z8eAwzAsDeKU81IcpZc-2rVDMJo="
    },
    {
        "name": "Brinjal",
        "url": "https://media.istockphoto.com/id/510515443/photo/eggplant-isolated-on-white.jpg?s=612x612&w=0&k=20&c=AfRLY-0SanZ7Xo1Vdgpdv--PmAbKOdPUiLtvw4X8YJY="
    },
    {
        "name": "Potato",
        "url": "https://media.istockphoto.com/id/157430678/photo/three-potatoes.jpg?s=612x612&w=0&k=20&c=qkMoEgcj8ZvYbzDYEJEhbQ57v-nmkHS7e88q8dv7TSA="
    },
    {
        "name": "Mushroom",
        "url": "https://images.pexels.com/photos/18669642/pexels-photo-18669642/free-photo-of-close-up-of-a-mushroom-in-the-forest.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Garlic",
        "url": "https://images.pexels.com/photos/10111494/pexels-photo-10111494.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Red Chilli",
        "url": "https://images.pexels.com/photos/7215171/pexels-photo-7215171.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Onion",
        "url": "https://media.istockphoto.com/id/690404352/photo/spanish-onions-on-black-slate-background.jpg?b=1&s=612x612&w=0&k=20&c=AOblKtuKYlnHnerIRMOZw8UYZnvCDAF2-HzNK4S4T3Y="
    },
    {
        "name": "Ginger",
        "url": "https://images.pexels.com/photos/11369666/pexels-photo-11369666.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Lemon",
        "url": "https://images.pexels.com/photos/7444967/pexels-photo-7444967.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        "name": "Orange",
        "url": "https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Strawberry",
        "url": "https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Watermelon",
        "url": "https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Grapes",
        "url": "https://images.pexels.com/photos/60021/grapes-wine-fruit-vines-60021.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Pineapple",
        "url": "https://images.pexels.com/photos/7156087/pexels-photo-7156087.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Pomogranate",
        "url": "https://images.pexels.com/photos/7657080/pexels-photo-7657080.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Banana",
        "url": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Papaya",
        "url": "https://images.pexels.com/photos/5507722/pexels-photo-5507722.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Cherry",
        "url": "https://images.pexels.com/photos/1394423/pexels-photo-1394423.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Coconut",
        "url": "https://images.pexels.com/photos/1803516/pexels-photo-1803516.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        "name": "Avocado",
        "url": "https://images.pexels.com/photos/14840388/pexels-photo-14840388.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Blackberry",
        "url": "https://images.pexels.com/photos/134581/blackberries-bramble-berries-bush-134581.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Fig",
        "url": "https://images.pexels.com/photos/5419213/pexels-photo-5419213.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Guava",
        "url": "https://images.pexels.com/photos/5945840/pexels-photo-5945840.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Muskmelon",
        "url": "https://images.pexels.com/photos/7657261/pexels-photo-7657261.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Kiwi",
        "url": "https://images.pexels.com/photos/14083854/pexels-photo-14083854.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Mango",
        "url": "https://images.pexels.com/photos/27684693/pexels-photo-27684693/free-photo-of-mangoes-are-piled-up-in-a-pile.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        "name": "Apple",
        "url": "https://images.pexels.com/photos/209439/pexels-photo-209439.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
        "name": "Cucumber",
        "url": "https://images.pexels.com/photos/17196492/pexels-photo-17196492/free-photo-of-close-up-of-cucumbers.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        "name": "Corn",
        "url": "https://images.pexels.com/photos/4042290/pexels-photo-4042290.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    },
    {
        "name": "Peas",
        "url": "https://images.pexels.com/photos/768091/pexels-photo-768091.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        "name": "Cauliflower",
        "url": "https://images.pexels.com/photos/18121431/pexels-photo-18121431/free-photo-of-cauliflowers-on-a-farm.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
    }
];

// const socketio = require("socket.io");
// const io = socketio(app);

let users = [];

let roomno = 1;

const n = arr.length;

let trr = new Array(n).fill(1);



io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // Send the current users (optional)
    socket.emit("welcome", users.map(s => s.user));

    socket.on("add", (user) => {
        socket.user = user;
        users.push(socket);

        if (users.length < 2) {
            socket.emit("wait", "Waiting for an opponent...");
        } else {
            // Matchmaking: take first two users from the queue
            const p1 = users.shift();
            const p2 = users.shift();

            console.log(`Match Found: ${p1.user} vs ${p2.user}`);

            p1.emit("match_found", p2.user);
            p2.emit("match_found", p1.user);

            const room = roomno;
            roomno++;

            p1.join(room);
            p2.join(room);

            for (let x = 0; x < 11; x++) {
                setTimeout(() => {
                    if (x == 10) {
                        p1.emit("result");
                        p2.emit("result");
                    }
                    else if(x<10) {
                        let options = [];
                        let a1 = Math.floor(Math.random() * n);
                        if (trr[a1] == 0) {
                            a1 = Math.floor(Math.random() * 4);
                        }
                        else {
                            trr[a1] = 0;
                        }
                        let a2 = a1;
                        while (a2 == a1) {
                            a2 = Math.floor(Math.random() * n);
                        }
                        let a3 = a2;
                        while (a3 == a1 || a3 == a2) {
                            a3 = Math.floor(Math.random() * n);
                        }
                        let a4 = a3;
                        while (a4 == a3 || a4 == a2 || a4 == a1) {
                            a4 = Math.floor(Math.random() * n);
                        }
                        options.push(arr[a1].name);
                        options.push(arr[a2].name);
                        options.push(arr[a3].name);
                        options.push(arr[a4].name);
                        let url = arr[a1].url;
                        options.push(url);
                        io.to(room).emit('quiz', (options));

                        p1.on("score", (data) => {
                            p2.emit("oscore", data);
                        });

                        p2.on("score", (data) => {
                            p1.emit("oscore", data);
                        });
                    }

                }, x * 10000);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user}`);
        // Remove from users queue if still in
        users = users.filter(s => s !== socket);
    });
});

