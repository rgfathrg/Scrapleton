var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");
var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/scrapedData", { useNewUrlParser: true });

app.get("/scrape", function (req, res) {
    axios.get("http://www.politico.com").then(function (response) {
        var $ = cheerio.load(response.data);

        $("h1.headline").each(function (i, element) {
            var result = {};
            result.title = $(this).children().text();
            result.link = $(this).find("a").attr("href");

            // Save these results in an object that we'll push into the results array we defined earlier
            if (result.title !== undefined && result.link !== undefined) {
                db.Article.create(result)
                    .then(function (dbArticle) {
                        // console.log(dbArticle);
                    })
                    .catch(function (err) {
                        return res.json(err);
                    });
            }
        });
        res.send("Scrape Complete");
    });
});

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            console.log(dbArticle);
            res.json(dbArticle);
        })
        .catch(function (err) {
            console.log(err);
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    var article = req.params.id;
    db.Article.findOne({ "_id": article })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        })
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ "_id": req.params.id }, { "note": dbNote._id }, { "new": true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port 3000!");
});
