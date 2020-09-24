const expres = require("express")
const app = expres()
const PORT = process.env.PORT || 8080;
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const sql = require('mssql')
const session = require('express-session');
const { config } = require("./config")
const cors = require('cors')
const axios = require('axios')
const nodemailer = require('nodemailer');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT, process.env.TWILIO_TOKEN);
const path = require('path');
const mime = require('mime');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ storage: config.storage })

var transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: process.env.GMAIL,
        pass: process.env.PMAIL
    }
});

app.use(cors())
app.use(session(config.session));
app.use(bodyParser.json());

app.use(expres.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(expres.static('public'));


app.listen(PORT, () =>  console.log('APP listen in port', PORT) )
 
app.get('/', (req, res) => {

    sess = req.session;
    if(sess.loged){
        return res.render('home', {name : sess.nombre, error : { status : false, message : "" }})
    }

    return res.render('landingpage', { error : { status : false, message : "" }})
})

app.get('/login', async (req, res) => {
    
    sess = req.session;
    const register = req.query.name ? true : false
    
    /*
    if(sess.try && sess.try.num === 3){
        if(sess.try.email.length > 0){
            let toBLACK = sess.try.email.map(mail => {
                return new Promise((resolve, _r) => {
                    sql.connect(config.db).then( pool => {
                        return pool.request()
                            .input('mail', sql.TYPES.VarChar, mail )
                            .query('insert into blacklist(mail) values(@mail)')
                    }).catch(e => {
                        console.log(e)
                        resolve(e)
                    })
                })
            })
            sess.try.email = []
        }
        return res.render('landingpage', {error : { status : true , message : "Tu cuenta esta bloqueada, contacta con soporte tecnico para volver a ingresar" } } )
    }
    */

    if(sess.loged){
        return res.render('home', {name : sess.name, nuevo : register})
    }
    return res.render("loginForm", {nuevo : register})
})

app.post('/login', async (req, res) => {

    const { mail, password, code } = req.body
    sess=req.session;
    console.log(sess)
    
    const black = await sql.connect(config.db).then( pool => {
        return pool.request()
            .input('mail', sql.TYPES.VarChar, mail)
            .query('select * from blacklist where mail = @mail')
    }).catch(e => {
        console.log(e)
        return false
    })
    
    const {recordset : list} = black
    if(list.length > 0){
        return res.render('landingpage', {error : { status : true, message : `Este correo esta en la lista negra` }})
    }

    const result = await sql.connect(config.db).then( pool => {
        return pool.request()
            .input('input_parameter', sql.TYPES.VarChar, mail)
            .query('select * from login l inner join role r on l.id = r.id where email=@input_parameter')
            //.query('select * from login where email = @input_parameter')
    }).catch(e => {
        console.log(e)
        return false
    })
    
    const {recordset} = result
    console.log("recordset", recordset)
    if(recordset.length <= 0){
        //sess.try = sess.try ? { num : sess.try.num +1 , email :  sess.try.email.concat(mail) } : { num : 1 , email : [mail] }
        //return res.render('landingpage', {error : { status : true, message : `No existe ningun usuario registrado con este correo, intentos restante ${3 - sess.try.num}` }})
        return res.render('landingpage', {error : { status : true, message : `No existe ningun usuario registrado con este correo` }})
    }
    const {pass,nombre, code : secret, id, access_code } = recordset.shift()
    const correctLogin = pass === Buffer.from(password).toString('base64')

    if(!correctLogin){
        //sess.try = sess.try ? { num : sess.try.num +1 , email :  sess.try.email.concat(mail) } : { num : 1 , email : [mail] }
        //return res.render('landingpage', {error : { status : true , message : `Password Incorrecta, intentos restantes ${3 - sess.try.num}` } } )
        return res.render('landingpage', {error : { status : true , message : `Password Incorrecta` } } )
    }
    
    if(code !== secret){
        //sess.try = sess.try ? { num : sess.try.num +1 , email :  sess.try.email.concat(mail) } : { num : 1 , email : [mail] }
        ///return res.render('landingpage', {error : { status : true , message : `Codigo de acceso incorrecto, intentos restantes ${3 - sess.try.num}` } } )
        return res.render('landingpage', {error : { status : true , message : `Codigo de acceso incorrecto` } } )
    }
    sess.loged = true;
    sess.nombre = nombre;
    sess.id_user = id[0]
    sess.access = access_code
    return res.redirect('home')
})

app.get('/home', (req, res)=> {
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    return res.render('home', { name : sess.nombre,  error : { status : false, message : "" } })
})

app.post('/save', async (req, res) => {
    
    console.log(req.body)
    sess=req.session;
    const { mail, password, nombre, phone } = req.body
    console.log( mail, password, nombre, phone )
    
    const max = 999999
    const min = 100000
    const random = (Math.random() * (max - min) + min).toFixed(0)

    const pass = Buffer.from(password).toString('base64')
    const result = await sql.connect(config.db).then( pool => {
           return pool.request()
            .input('nombre', sql.TYPES.VarChar, nombre)
            .input('mail', sql.TYPES.VarChar, mail)
            .input('pass', sql.TYPES.VarChar, pass)
            .input('phone', sql.TYPES.VarChar, phone)
            .input('code', sql.TYPES.VarChar, random)
            .query('insert into login(nombre, email, pass, phone, code) values(@nombre, @mail, @pass, @phone, @code )')
        }).catch(e => {
            console.log(e)
            return false
    })
    
    const mailOptions = {
        from: process.env.GMAIL,
        to: mail,
        subject: 'Landing Page', 
        html: `<h1>Bienvenido</h1> <br> ingresa con el siguiente codigo: ${random}`
    };
    
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
            console.log(err)
        else
            console.log(info);
    });
    
    /*twilio.messages
        .create({
            body: `Tu codigo de ingreso es ${random}`,
            from: '+12054798880',
            to: `+502${phone}`
        })
        .then(message => console.log(message.sid));
    sess.nombre = nombre
    sess.loged = true;
    */
    return res.redirect('login');
})

app.post('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });
})

app.post('/verify', async (req,res) =>{

    const {token , value } = req.body;

    var result = await axios.post("https://www.google.com/recaptcha/api/siteverify", {}, {
        params: {
            secret: process.env.CAPTCHA_SECRET,
            response: token
        }
    });
    const {success } = result.data
    console.log("google response:", result.data)

    if(!success) {
        return res.status(400).json({
            status : 0,
            title :  "Error",
            message : "Invalid recaptcha",
            reason : result.data
        });
    }else{
        return res.status(200).json({
            status : 1,
            title :  "success",
            message : "Valid recaptcha",
            reason : result.data
        });
    } 
})

app.get('/users', async (req, res)=> {
    
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    let permiso = sess.access.split("");
    if(parseInt(permiso[2]) !== 1 ){
        return res.render('home', {name : sess.nombre, error : { status : true , message : "Tu usuario no puede modificar los permisos :( " }})
    }
    const list = sql.connect(config.db).then( pool => {
        return pool.request()
            .query('select * from login l inner join role r on l.id = r.id')
    }).catch(e => {
        console.log(e)
        return false
    })
    let Result = await list;
    const {recordset : Users} = Result
    return res.render('roles', { Users })
})

app.post('/UpdateRol', async (req, res)=> {
    const {id, access_code} = req.body;

    let up = sql.connect(config.db).then( pool => {
        return pool.request()
            .input('id', sql.TYPES.VarChar, id )
            .input('access_code', sql.TYPES.VarChar, access_code )
            .query('update role set access_code=(@access_code) where id=(@id)')
    }).catch(e => {
        console.log(e)
        resolve(e)
    })
    let result = await up;
    let {rowsAffected} = result
    let aff = parseInt(rowsAffected.shift()) > 0
    if(aff){
        return res.status(200).json({
            status : 1,
            title :  "success",
            message : "Permiso actualizado",
            reason : result
        });
    }else{
        return res.status(200).json({
            status : 0,
            title :  "Error",
            message : "No fue posible actulizar el registro",
            reason : result
        });

    }
})

app.get('/upload', function(req, res){
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    let permiso = sess.access.split("");
    
    if(parseInt(permiso[1]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede subir archivos :(" }})
    }

    return res.render('upload')
})

app.post('/upload', upload.single('myFile'), async (req, res) => {
    try{
        const file = req.file
        sess = req.session;
        if (!file) {
            return res.send(`<div style="font-size:30px"><center><h1>El archivo ingresado no es valido </h1><script> setTimeout(function(){ window.location.href = '/upload'; },3000); </script> <img src="http://www.phuketontours.com/phuketontours/public/assets/front-end/images/404.gif"/> </center></div>`);
        }
        const logger = await sql.connect(config.db).then( pool => {
            return pool.request()
                .input('event', sql.TYPES.VarChar, "UPLOAD")
                .input('usuario', sql.TYPES.Int, sess.id_user )
                .input('file_name', sql.TYPES.VarChar, file.originalname )
                .input('file_type', sql.TYPES.VarChar, file.mimetype )
                .query('insert into file_logs(mark, event, usuario, file_name, file_type) values(GETDATE(),@event, @usuario, @file_name, @file_type  )')
        }).catch(e => {
            console.log(e)
            return false
        })
        return res.send(`<div style="font-size:30px"><center><h1>Tu archivo se ha subido!!!!</h1><script> setTimeout(function(){ window.location.href = '/files' },3000); </script> <img src="https://i0.pngocean.com/files/873/563/814/computer-icons-icon-design-business-success.jpg"/> </center></div>`);
    }catch(e){
        res.redirect('/', {error: e.message})
    }
})

app.get('/download/:id', function(req, res){
    const name = req.params.id
    sess = req.session;
    var file = __dirname + `/FILES/${name}`;
    var filename = path.basename(file);
    var mimetype = mime.lookup(file);
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);
    var filestream = fs.createReadStream(file);
    filestream.pipe(res);
        
    const logger = sql.connect(config.db).then( pool => {
        return pool.request()
            .input('event', sql.TYPES.VarChar, "DOWNLOAD")
            .input('usuario', sql.TYPES.Int, sess.id_user )
            .input('file_name', sql.TYPES.VarChar, name )
            .query('insert into file_logs(mark, event, usuario, file_name) values(GETDATE(),@event, @usuario, @file_name  )')
    }).catch(e => {
        console.log(e)
        return false
    })
});

app.get('/files', async (req,res) => {
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    let permiso = sess.access.split("");

    if(parseInt(permiso[0]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede ver los archivos :(" }})
    }

    const list = sql.connect(config.db).then( pool => {
        return pool.request()
            .query('select * from file_logs')
    }).catch(e => {
        console.log(e)
        return false
    })
    let Result = await list;
    const {recordset : Files} = Result
    return res.render('files', { Files })
})

app.use(function(req,res){
    res.status(404).send('<div><center> <img src="http://www.phuketontours.com/phuketontours/public/assets/front-end/images/404.gif"/> </center></div>');
});

