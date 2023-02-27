const express = require("express");
const router = express.Router();

// Do work here
router.get("/", (req, res) => {
  const wes = { name: "Wes", age: 100, cool: true };
  //Can only send one piece of data at time
  // res.send('Hey! It works!');
  // res.json(wes);
  // res.send(req.query.name);
  //res.send(req.query); //will echo back the parameters in the URL such as /?name=kait&age=100&cool=true in json format
  //Jade changed to Pug or .pug
  //the below will pull the information from the request which is sent via the render and what is placed in the URL
  res.render("hello", {
    name: "wes",
    dog: req.query.dog,
    title: "I love food",
  });
});

router.get("/reverse/:name", (req, res) => {
  const reverse = [...req.params.name].reverse().join("");
  res.send(reverse);
});

module.exports = router;
