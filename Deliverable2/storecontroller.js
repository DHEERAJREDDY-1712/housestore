var mysql= require('mysql');
var bodyParser=require('body-parser');
const { request } = require('http');
const { response } = require('express');
var fs=require('fs');
var multer=require('multer'); //file upload operations
//var alert = require('alert'); 
const { config } = require('process');
var urlencodedParser=bodyParser.urlencoded({extended: false});
var con= mysql.createConnection({
    host: "localhost",
    user:"root",
    password: "",
    database: "house_store"
}); //connection to the mysql database

var userdata="";

var Storage=multer.diskStorage({
    destination:function(req,file,callback){
        callback(null,"public/images/");
    },
    filename:function(req,file,callback){
        callback(null,file.originalname);
    }
});

var addtoCart=function(productID=0){
let found=false;
this.data.items.forEach(item=>{
    if(item.id===productID){
        found=true;
    }
});
return found;
}

var calculateTotals=function(){
    this.data.totals=0;
    this.data.items.forEach(item=>{
        let price=item.price;
        let qty=item.qty;
        let amount=price*qty;
        this.data.totals+=amount;
    });
    this.setFormattedTotals();
}

var setFormattedTotals=function(){
    let format= new Intl.NumberFormat(config.locale.lang,{style:'currency',currency:config.locale.currency});
    let totals=this.data.totals;
    this.data.formattedTools =format.format(totals);
}

var addToCart=function(product=null,qty=1){
    if(!this.inCart(product.product_id)){
        let format=new Intl.NumberFormat(config.locale.lang,{
            style:'currency',currency:config.locale.currency
        });
        let prod={
            id:product.product_id,
            title:product.title,
            price:product.price,
            qty:qty,
          //  image=product.image,
            formattedPrice:format.format(product.price)
        };
        this.data.items.push(prod);
        this.calculateTotals();
    }
}

var upload=multer({
storage:Storage
}).single("imguploader");

var myCss={
    style:fs.readFileSync('public/css/style.css','utf-8')
};
module.exports= function(app) {
    app.get('/home',function(req,res){
        if(req.session.loggedin==true){
        //req.session.username=req.body.username;
        //res.redirect("home");
        res.render("Home",{udata:userdata,usertype:req.session.usertype});
        }else{
            res.redirect(301,"login");
            console.log("Not Loggedin!!!");
        }
    });

    app.get('/aboutus',function(req,res){
        res.render('aboutus',{udata:userdata,usertype:req.session.usertype});
    });

    app.get('/register',function(req,res){
        //res.render('signup',{udata:userdata,usertype:req.session.usertype});
            console.log('We got 1 more user');
            res.render('signup',{title: 'Registeration Page',
            myCss:myCss,
            udata:userdata,usertype:""});
        //    res.render('registration',{udata:userdata,usertype:req.session.usertype});
    });

    
        app.get('/login',function(req,res){
            if(req.session.loggedin){
                //res.end('<html><head><script>alert("You\'re already loggedin!");</script></head><body><a href="logout">Logout</body><html>');
            //res.render("home",{udata:userdata});
               // popup.alert({content:"you're already loggedin"});   
            }else{
                console.log('We got 1 more user');
                res.render('login',{title: 'Login Page',
                myCss:myCss,
                udata:userdata,usertype:""});           
          //  res.render('login',{udata:userdata,usertype:req.session.usertype});
            }
        });
       
   
    app.get('/login',function(req,res){
        if(req.session.loggedin){
            //res.end('<html><head><script>alert("You\'re already loggedin!");</script></head><body><a href="logout">Logout</body><html>');
        //res.render("home",{udata:userdata});
           // popup.alert({content:"you're already loggedin"});   
        }else{           
        res.render('login',{udata:userdata,usertype:req.session.usertype});
        }
    });

    app.get('/contactus',function(req,res){
        res.sendFile('contactus.html',{root:'public'});
    });

   
    app.post('/contactus',function(req,res){
        if(req.body.name!=null && req.body.email!=null && req.body.subject!=null && req.body.message!=null){
        var personName=req.body.name;
        var personEmail=req.body.email;
        var personSubject=req.body.subject;
        var personMessage=req.body.message;
            console.log("Contact us!!");
            query=  "insert into `contactus`( `name`, `email`, `subject`, `message`) values ('"+personName+"','"+personEmail+"','"+personSubject+"','"+personMessage+"');";
            con.query(query,function(err,result,fields){
                    if(err){
                    //    window.alert("Error in Contactus");
                    console.log("Error in Contactus");
                    throw err;
                    }else{
                        console.log("Received Feedback!!");
                        res.end("OK");
                        //res.redirect(301,"login");
                    }
                    });
           // res.end("<html><head><script>alert('Thank you for Contacting we will get back to you asap!')</script><head><body><a href='home'>Go Back</a></body></html>"); 
           }
       
    });

    app.post('/logincheck',function(req,res){
    var userType=req.body.usertype;
    var userPassword=req.body.password;
    var userEmail=req.body.email;
    var query=null;
    if(userType=='employee'){
    query="select * from admin where email='"+userEmail+" ' and password='"+userPassword+"'";
    }else{
        query="select * from customer where email='"+userEmail+" ' and password='"+userPassword+"'";
    }

    con.query(query,function(err,result,fields){
        if(result.length>0){
            req.session.loggedin=true;
            req.session.usertype=userType;
            req.session.useremail=userEmail;
            userdata=JSON.parse(JSON.stringify(result));
            console.log('User data:'+userdata);
            res.redirect(301,"home");
        }else{
            res.end("<html><head><script>alert('Invalid login Credentials!')</script><head><body><a href='home'>Go Back</a></body></html>"); 
        }
    })
    });

        app.post('/registerme',urlencodedParser,function(req,res){
        console.log('User registeration request');
        if(req.body.name!=null && req.body.email!=null && req.body.password!=null && req.body.phone!=null){
        var name=req.body.name;
        var email=req.body.email;
        var password=req.body.password;
        var phone=req.body.phone;
        console.log("registering!!");
        query=  "insert into `customer`( `name`, `email`, `password`, `phone`) values ('"+name+"','"+email+"','"+password+"','"+phone+"');";
        con.query(query,function(err,result,fields){
                if(err){
                 //   window.alert("Error in Registeration");
                console.log("Error in registeration");
                throw err;
                }else{
                    console.log("registered!!");
                    res.redirect(301,"login");
                }
                });
       }
        
    });

    
   

    app.get('/logoutme',function(req,res){
        console.log("Logged out!");
        req.session.loggedin=null;
        req.session.username=null;
        req.session.usertype=null;
        req.session.useremail=null;
        userdata=null;  
        console.log('logged out!');
        req.session.destroy(function(err){
                if(err){
                    console.log(err);
                }else{
                 console.log("Logged out");   
                }
        });
        res.render("login",{udata:userdata,usertype:""});
    });

    app.get('/products',function(req,res){
        if(req.session.loggedin){
            res.render('products',{usertype:req.session.usertype,udata:userdata});
        }else{
            res.end("<html><head><script>alert('please Login to view this page!')</script><head><body><a href='home'>Go Back!</a></body></html>"); 
        }
        
    });
    app.get('/addproduct',function(req,res){
        res.render("addproduct",{udata:userdata});
    });

    app.get('/showcart',function(req,res){
        res.render("addproduct",{udata:userdata});
    });
    app.post('/addproduct',function(req,res){
        var primage=null;  
        upload(req,res,function(err){
                console.log(err);
               if(err){
                   throw err;
                   //return res.end("<script>alert('something went wrong!');</script>");
               }else{
                console.log(req.file.originalname);
                primage='images/'+req.file.originalname;

                //    req.files.forEach(function(value,key) {
                //        console.log(value.originalname);
                //        productimage='images/'+value.originalname;
                //    });
                //var productimage='images/'+req.files[0].filename;   
                var prtype=req.body.prtype;
                var prname=req.body.prname;
                var prprice=req.body.prprice+'';
                var prdescription=req.body.prdescription;
                var prquantity=req.body.prquantity+'';
                var prsellername=req.body.prsellername;
                var pravailablecount=req.body.prquantity+'';
                console.log(prtype,prname,prdescription,prprice,prquantity,prsellername,pravailablecount);
                if(req.session.loggedin){
                   var query="INSERT INTO `product`(`name`, `price`, `image`, `description`, `type`, `quantity`,`sellername`,`availablecount`) values('"+prname+"','"+prprice+"','"+primage+"','"+prdescription+"','"+prtype+"','"+prquantity+"','"+prsellername+"','"+pravailablecount+"')"; 
                    con.query(query,function(err,result,fields){
                        console.log('result'+result);
                        if(err){
                            console.log(err);
                            return res.end("<script>alert('something went wrong!');</script>");
                        }else{
                          //  res.alert("car booked successfully!!!");
                          return res.end("<html><head><script>alert('Product Added Successfully!')</script><head><body><a href='home'>Go Back!</a></body></html>");  
                         //res.end("Car booked successfully!! ");
                        }             
                    });            
                }       
               }
            });
       // res.render("addproduct",{udata:userdata});

    })

  

    app.post('/addbooking',function(req,res){
        var carid=req.body.carid;
        var pickupdate=req.body.pdate;
        var pickuptime=req.body.ptime;
        var deliverydate=req.body.ddate;
        var deliverytime=req.body.dtime;
        var username=req.session.username;
        if(req.session.loggedin){
           var query="insert into booking(cid,pdate,ptime,ddate,dtime,username) values('"+carid+"','"+pickupdate+"','"+pickuptime+"','"+deliverydate+"','"+deliverytime+"','"+username+"')"; 
            con.query(query,function(err,result,fields){
                if(err){
                    return res.end("something went wrong!");
                }else{
                  //  res.alert("car booked successfully!!!");
                  res.end("<html><head><script>alert('Registered Successfully!')</script><head><body><a href='home'>Go Back!</a></body></html>");  
                 //res.end("Car booked successfully!! ");
                }             
            });            
        }
    });

    app.get('/bedroom',function(req,res){
        data="";
        var query="select * from product where type='bedroom';";
        if(req.session.loggedin){
            con.query(query,function(err,result,fields){
                if(err)
                throw err;
                data=JSON.parse(JSON.stringify(result));
                console.log("Data is "+data);
                res.render('bedroom',{bedrooms:data,usertype:req.session.usertype});
            });
        }else{
           // response.send('content-type','application/json');
           res.end("<html><head><script>alert('please Login to view this page!')</script><head><body><a href='home'>Go Back!</a></body></html>"); 
        }
       // res.render('luxury',{});
    });

    app.get('/livingroom',function(req,res){
        data="";
        var query="select * from product where type='livingroom';";
        if(req.session.loggedin){
            con.query(query,function(err,result,fields){
                if(err)
                throw err;
                data=JSON.parse(JSON.stringify(result));
                console.log("Data is "+data);
                res.render('livingroom',{livingrooms:data,usertype:req.session.usertype});
            });
        }else{
           // response.send('content-type','application/json');
           res.end("<html><head><script>alert('please Login to view this page!')</script><head><body><a href='home'>Go Back!</a></body></html>"); 
        }
       // res.render('luxury',{});
    });

    app.get('/kitchen',function(req,res){
        data="";
        var query="select * from product where type='kitchen';";
        if(req.session.loggedin){
            con.query(query,function(err,result,fields){
                if(err)
                throw err;
                data=JSON.parse(JSON.stringify(result));
                console.log("Data is "+data);
                res.render('kitchen',{kitchens:data,usertype:req.session.usertype});
            });
        }else{
           // response.send('content-type','application/json');
           res.end("<html><head><script>alert('please Login to view this page!')</script><head><body><a href='home'>Go Back!</a></body></html>"); 
        }
       // res.render('luxury',{});
    });

    app.get('/outdoor',function(req,res){
        data="";
        var query="select * from product where type='outdoor';";
        if(req.session.loggedin){
            con.query(query,function(err,result,fields){
                if(err)
                throw err;
                data=JSON.parse(JSON.stringify(result));
                console.log("Data is "+data);
                res.render('outdoor',{outdoors:data,usertype:req.session.usertype});
            });
        }else{
           // response.send('content-type','application/json');
           res.end("<html><head><script>alert('please Login to view this page!')</script><head><body><a href='home'>Go Back!</a></body></html>"); 
        }
       // res.render('luxury',{});
    });

    


}