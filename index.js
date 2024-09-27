const port = 5000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

//Database Connection     
mongoose.connect("mongodb+srv://Tritus:fD8eNam1NU4tXRUq@cluster.trghxbv.mongodb.net/Trendz");
mongoose.connection
.once("open",() => console.log("DB Connected"))
.on("error",(error)=>{
  console.log(`ERROR : ${error}`);
})


//API Creation
app.get("/",(req, res)=>{
  res.send("Express App is Running")
})

//Image Storage
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename:(req, file, cb)=>{
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({storage:storage})

//Creating Upload EndPoint for Images
app.use("/images", express.static("upload/images"))
app.post("/upload", upload.single("product"),(req, res)=>{
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  })
})
//Product Schema
const Product = mongoose.model("Product",{
  id:{
    type: Number,
    required: true,
  },
  name:{
    type: String, 
    required: true,
  },
  image:{
    type: String,
    required: true,
  },
  category:{
    type: String, 
    required: true,
  },
  new_price:{
    type: Number,
    required: true,
  },
  old_price:{
    type: Number,
    required: true,
  },
  date:{
    type: Date,
    default: Date.now,
  },
  available:{
    type: Boolean,
    default: true,
  },
})  

//Schema creating for user model
const Users = mongoose.model("Users",{
  name:{
    type: String,
  },
  email:{
    type: String,
    unique: true,
  },
  password:{
    type: String,
  },
  cartData:{
    type: Object,
  },
  date:{
    type: Date,
    default: Date.now,
  },
})

//Creating EndPoint for registering the User
app.post("/signup", async(req, res)=>{
  let check = await Users.findOne({email:req.body.email});
  if(check){
    return res.status(400).json({success: false, errors:"existing user with same email address"})
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0; 
  }
  const user = new Users({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  })
  await user.save();
  const data = {
    user:{
      id: user.id
    }
  }
  const token = jwt.sign(data, "secret_ecom");
  res.json({success: true, token})
})

//Creating Endpoint for User Login

app.post("/login", async(req, res)=>{
  let user = await Users.findOne({email:req.body.email});
  if(user){
    const comparePass = req.body.password === user.password;
    if(comparePass){
      const data = {
        user:{
          id: user.id
        }
      }
      const token =jwt.sign(data, "secret-ecom");
      res.json({success: true, token});
    }else{
      res.json({success: false, errors:"Your Password is Incorrect"});
    }
  }else{
    res.json({success: false, errors:"Incorrect Email Address"})
  }
})

const users = [{ id: 1, username: 'user', password: 'pass' }];

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id }, 'secret-ecom');
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.post("/addproduct", async(req, res)=>{
  let products = await Product.find({});
  let id;
  if(products.length>0){
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id+1;
  }else{
    id= 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("Saved");
  res.json({
    success: 1,
    name: req.body.name,
  })
})

//  Creating API to Delete the Product
app.post("/removeproduct", async(req, res)=>{
  await Product.findOneAndDelete({id: req.body.id});
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  })
})

// Creating API to get All Products
app.get("/allproducts", async(req, res)=>{
  let products = await Product.find({});
  console.log("All Products are Fetched");
  res.send(products);
})

app.listen(port,(error)=>{
  if(!error){
    console.log("Server is Running on Port "+port)
  }else{
    console.log("Error: "+error)
  }
})