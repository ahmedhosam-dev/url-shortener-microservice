require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Connect to database
mongoose.connect(process.env.DB_URL);

// Database model
const urlSchema = new mongoose.Schema({
  orignUrl: String,
  date: {
    type: Date,
    default: () => Date.now(),
  },
  click: Number,
});

const UrlModel = mongoose.model("UrlModel", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:id", async (req, res) => {
  try {
    let orignUrl = await UrlModel.findById(req.params.id).then(
      async (data, err) => {
        if (err) return res.status(404).json({ error_message: err });
        data.click += 1;
        await data.save();
        res.redirect(data.orignUrl);
      }
    );
  } catch (e) {
    res.status(500).json({ message: e });
  }
});

app.post("/api/shorturl", async (req, res) => {
  try {

    let urlPattern = new RegExp(
      "^(https?:\\/\\/)?" + // validate protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    );

    if (!urlPattern.test(urlString)) return res.status(400).json({ error: "invalid url" })

    const newUrl = new UrlModel({
      orignUrl: req.body.url,
      click: 0,
    });

    await newUrl.save().then(() => {
      console.log("New url added!");
    });
    res.json({
      original_url: req.body.url,
      short_url: String(newUrl._id),
    });
  } catch (e) {
    console.log(e);
  }
});

// Listen port

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
