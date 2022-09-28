const express = require("express");
const app = express();

const fs = require("fs");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

var cursorPosition = 0;

const N = 10;

const queue = [];

fs.open("./data/log.log", "r", function (err, fd) {
  if (err) {
    console.log(err);
  } else {
    fs.readFile("./data/log.log", "utf8", function (err, data) {
      if (err) {
        console.log(err);
      } else {
        if (queue.length < N) {
          const lines = data.split("\n");

          console.log(lines);

          const lastNLines = lines;

          console.log(lastNLines);

          lastNLines.forEach((line) => {
            queue.push(line);
          });
        }

        cursorPosition = data.length;
      }
    });
    fs.watchFile(
      "./data/log.log",
      {
        interval: 100,
      },
      function (curr, prev) {
        console.log("New data");

        const sizeOfFile = fs.statSync("./data/log.log").size;

        fs.read(
          fd,
          Buffer.alloc(sizeOfFile - cursorPosition),
          0,
          sizeOfFile - cursorPosition,
          cursorPosition,
          function (err, bytesRead, buffer) {
            if (err) {
              console.log(err);
            } else {
              console.log(queue.length);
              if (queue.length < N) {
                const lines = buffer.toString("utf8").split("\n");

                console.log(lines);

                const lastNLines = lines.slice(lines.length - N);

                for (let i = 1; i < lastNLines.length; i++) {
                //   queue.shift();
                  queue.push(lastNLines[i]);
                }

                console.log(lastNLines);

                // queue.push(lastNLines);
              } else {
                const newLines = buffer.toString().split("\n");

                for (let i = 1; i < newLines.length; i++) {
                  queue.shift();
                  queue.push(newLines[i]);
                }
              }

              cursorPosition += bytesRead;

              io.emit("update", queue);
            }
          }
        );
      }
    );
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");

  io.emit("update", queue);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.get("/", (req, res) => {
  res.send(queue);
});

app.get("/logs", (req, res) => {
  res.sendFile(__dirname + "/views/logs.html");
});

server.listen(3000, () => {
  console.log("Server started on port 3000");
});
