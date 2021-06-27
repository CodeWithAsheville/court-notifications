const express = require("express");
const { searchCourtRecords } = require("./server/search-court-records");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/court-search", (req, res) => {
  searchCourtRecords(req.body, (cases) => res.json(cases), console.log);
});

if (process.env.NODE_ENV === "production") {
  // Serve any static files
  app.use(express.static(path.join(__dirname, "client/build")));

  // Handle React routing, return all requests to React app
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "../", "client/build", "index.html"));
  });
}

app.listen(port, () => console.log(`Listening on port ${port}`));
