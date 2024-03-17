const fs = require("fs");
let requestHandler = (req, res) => {
  const url = req.url;
  const method = req.method;
  if (url === "/") {
    //routing requests
    res.write("<html>");
    res.write("<head><title>Enter message</title></head>");
    res.write(
      '<body><form action="/message" method="POST"><input type="text" name="message"><button type="submit">Send</button></form></body>'
    );
    res.write("</html>");
    return res.end();
  }
  //Redirecting requests
  //Parsing request bodiess
  if (url === "/message" && method === "POST") {
    const body = [];
    req.on("data", (chunk) => {
      console.log(chunk);
      body.push(chunk);
    });
    req.on("end", () => {
      const parsedBody = Buffer.concat(body).toString();
      const message = parsedBody.split("=")[1];
      fs.writeFile("message.txt", message, (err) => {
        res.statusCode = 302;
        // res.setHeader("Location", "/");
        return res.end();
      });
    });
  }
  res.setHeader("content-type", "text/html");
  res.write("<html>");
  res.write("<head><title>My First Page</title></head>");
  res.write("<body><h1>Hello Node.js</h1></body>");
  res.write("</html>");
  res.end();
};

//module.exports=requestHandler;

module.exports = {
  handler: requestHandler,
  someText: "Some hard coded text",
};

/* exports.handler=requestHandler
exports.someText='Some hard code text'
 */
