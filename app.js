const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { MongoClient, ServerApiVersion } = require('mongodb');
const date = require(__dirname + "/date.js"); // export data from date.js

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



// Establish connection with MongoDB Atlas online 
const url = "mongodb+srv://Margo:Margo123@cluster0.kqdffeu.mongodb.net/todolist?retryWrites=true&w=majority"; 

// Establish connection with MongoDB localhost server
//const url = "mongodb://127.0.0.1:27017/todolistDB"; 

async function connect() {
  // Find the items from MongoDB using Mongoose
  try {
    await mongoose.connect(url);
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Listening on port 3000");
    });
  } catch (err) {
    console.log("Error connecting to MongoDB: " + err);
  }
}

connect();

// Create Mongoose Schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

// Schema for the new customlist under itemsSchema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

// Create Mongoose Model (appear as collection in MongoDB)
const Item = mongoose.model("Item", itemsSchema); // ("SingularName", SchemaName)
const List = mongoose.model("List", listSchema);

// Create document for Item model taht stick to the itemsSchema
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  const day = date.getDate(); // call function from date.js

  async function find() {
    try {
      const foundItems = await Item.find(); // Find data from MongoDB and named it foundItems

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems).then(() =>
          console.log("Succesfully saved items to DB")
        );
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    } catch (err) {
      console.log("Error connecting to MongoDB: " + err);
    }
  }

  find();
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate(); // call function from date.js

  const item = new Item({
    name: itemName,
  });

  async function findOne() {
    try {
      const foundList = await List.findOne({ name: listName }); // Find data from MongoDB and named it foundItems
      if (listName === day) {
        // Push list at the Today list
        item.save();
        res.redirect("/");
      } else {
        // Push the item into the list
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.log("Error connecting to MongoDB: " + err);
    }
  }

  findOne();
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();

  async function UpdateOne() {
    try {
      const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}); // Find data from MongoDB and named it foundItems
      if (listName === day) {
        // Delete checked item in the "Today" todolist
        Item.findByIdAndRemove(checkedItemId).then(() =>
        console.log("Succesfully delete the checked items"));
        res.redirect("/");
      } else {
        // Delete checked item in the custom todolist
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.log("Error connecting to MongoDB: " + err);
    }
  } 
  UpdateOne();
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  async function customOne() {
    try {
      const foundList = await List.findOne({ name: customListName }); // Find data from MongoDB and named it foundItems
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    } catch (err) {
      console.log("Error connecting to MongoDB: " + err);
    }
  }
  customOne();
});

app.get("/about", function (req, res) {
  res.render("about");
});
