const http = require("http");
const fs = require("fs");
const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;
  if (url === "/") {
    res.write("<html>");
    res.write("<head><title>User Data</title></head>");
    res.write("<body>");
    res.write("<h1>Hello Users</h1>");
    res.write("<form action='/create-user' method='POST'>");
    res.write('<input type="text" name="username">');
    res.write('<button type="Submit">Click Me</button>');
    res.write("</form>");
    res.write("</body>");
    res.write("</html>");
    return res.end();
  }
  if (url === "/users") {
    res.write("<html>");
    res.write("<head><title>Users List</title></head>");
    res.write("<body><ul> <li>User 1</li><li>User 2</li></ul></body>");
    res.write("</html>");
    return res.end();
  }
  if (url === "/create-user" && method === "POST") {
    const body = [];
    req.on("data", (chunk) => {
      console.log(chunk);
      body.push(chunk);
    });
    req.on("end", () => {
      const parsedBody = Buffer.concat(body).toString();
      const message = parsedBody.split("=")[1];
      console.log(message);
    });
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
  }
});

server.listen(2000);
