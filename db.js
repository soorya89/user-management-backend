const mongoose = require("mongoose");

mongoose.connect("mongodb://0.0.0.0:27017/jwt",{
    useNewUrlParser:true,
    useUnifiedTopology: true,
}).then(()=>{
    console.log("DB connected successfully");
}).catch((err)=>{
 console.log(err.message);
})


module.exports = mongoose;
