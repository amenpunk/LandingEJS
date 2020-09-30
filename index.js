const expres = require("express")
const app = expres()
const PORT = process.env.PORT || 8080;
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
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
const { User, Role, Log } = require("./Models")
const GPG = require("gpg")

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
    
    const black = await User.isInBlackList(mail)
    
    const {recordset : list} = black
    if(list.length > 0){
        return res.render('landingpage', {error : { status : true, message : `Este correo esta en la lista negra` }})
    }

    const result = await User.verifyCredentials(mail)
    const {recordset} = result
    if(recordset.length <= 0){
        //sess.try = sess.try ? { num : sess.try.num +1 , email :  sess.try.email.concat(mail) } : { num : 1 , email : [mail] }
        //return res.render('landingpage', {error : { status : true, message : `No existe ningun usuario registrado con este correo, intentos restante ${3 - sess.try.num}` }})
        return res.render('landingpage', {error : { status : true, message : `No existe ningun usuario registrado con este correo` }})
    }
    const {pass,nombre, code : secret, id, access_code, GPG } = recordset.shift()
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
    sess.finger = GPG;
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
    
    sess=req.session;
    let { mail: email , password , nombre, phone } = req.body
    const max = 999999
    const min = 100000
    const code = (Math.random() * (max - min) + min).toFixed(0)

    
    const user = new User({ email, password, nombre, phone, code })
    const write = await user.fileScript();
    
    if(!write.status){ 
        return res.render("loginForm", {nuevo : true})
    }
    
    user.ruta = write.file
    const firma = await user.generateGPG();
    const finger = await User.getFingerprint(firma);
    user.GPG = finger
    user.password = Buffer.from(password).toString('base64')
    const result = await user.save();
    
    const mailOptions = {
        from: process.env.GMAIL,
        to: email,
        subject: 'Landing Page', 
        html: `<h1>Bienvenido</h1> <br> ingresa con el siguiente codigo: ${code}`
    };
    /*
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
            console.log(err)
        else
            console.log(info);
    });
    twilio.messages
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
    var result = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${token}`)
    const {success } = result.data

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
    const list = User.getAll(); 
    let Result = await list;
    const {recordset : Users} = Result
    return res.render('roles', { Users })
})

app.post('/UpdateRol', async (req, res)=> {

    const {id, access_code} = req.body;
    const role = new Role({id, access_code})
    let result = await role.update();
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

app.get('/upload', async function(req, res){
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    let permiso = sess.access.split("");
    
    if(parseInt(permiso[1]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede subir archivos :(" }})
    }
    let userlist = await User.getAll();
    const {recordset : usuarios} = userlist;

    return res.render('upload', {usuarios})
})

app.post('/upload', upload.single('myFile'), async (req, res) => {
    try{
        const file = req.file
        sess = req.session;
        const id = Buffer.from(file.originalname).toString('base64')
        sess.file = id;

        console.log(req.body)
        const buffe_file = new Promise((resolve, _r) => {
            fs.readFile( file.path, function(err, file) { 
                if(err){
                    console.log(err)
                    return resolve(err)
                } 
                return resolve(file)
            })
        })
        const buffer = await Promise.resolve(buffe_file)

        if (!file) {
            return res.send(`<div style="font-size:30px"><center><h1>El archivo ingresado no es valido </h1><script> setTimeout(function(){ window.location.href = '/upload'; },3000); </script> <img src="http://www.phuketontours.com/phuketontours/public/assets/front-end/images/404.gif"/> </center></div>`);
        }

        const log =  new Log({ event : "UPLOAD", usuario : sess.id_user, file_name : file.originalname, file_type : file.mimetype, name : id })
        const logger = await log.save();
        return res.send(`<div style="font-size:30px"><center><h1>Tu archivo se ha subido!!!!</h1><script> setTimeout(function(){ window.location.href = '/files' },3000); </script> <img src="https://i0.pngocean.com/files/873/563/814/computer-icons-icon-design-business-success.jpg"/> </center></div>`);

    }catch(e){
        console.log("error al subir el archivo:", e.message)
        return res.redirect('/', {error: e.message})
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
    const log =  new Log({ event : "DOWNLOAD", usuario : sess.id_user, file_name : name, file_type : "" })
    log.save();
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

    const list = await Log.getAll();
    const {recordset : Files} = list
    return res.render('files', { Files })
})

app.post('/test', async (req,res) => {

    let userlist = await User.getAll();
    const {recordset : usuarios} = userlist;
    let mingKey = "BA020F5FB37B8EF0";
    let builKey = "63A86E89978C1715";
    var args = [
        '--default-key', mingKey,
        '--recipient', builKey, 
        '--armor',
        '--trust-model', 'always', 
    ];

    fs.readFile('/home/cyberpunk/Documents/UMG-20202/Landing/FILES/ORIGINAL/gg.png', function(err, file) { 
        if(err) console.log(err)
        GPG.encrypt(file, args, function(err, encrypted){
            if(err) return res.send({status : err})
            fs.writeFile('/home/cyberpunk/Documents/UMG-20202/Landing/FILES/ENCRIPTED/gg.png',encrypted , (err) => {
                if (err) return res.send({status : false})
                console.log('archivo encriptado');
                // success case, the file was saved
                return res.send({status : true})
            });
        });


    })
    //return res.end()


    /*
    fs.readFile(path.join(__dirname, 'firma.key'), function(err, file) {
        GPG.importKey(file, function(importErr, result, fingerprint) {
            if(importErr) console.log(importErr)
            console.log("fingerprint",fingerprint)
            console.log("result",result)
            return res.sendFile(path.join(__dirname , 'firma.key'))

        });
        gpg.importKey(file, function(importErr, result, fingerprint) {
            assert.ifError(importErr);
            assert.ok(/secret keys read: 1/.test(result));
            assert.ok(/key 6F20F59D:/.test(result));
            assert.ok(fingerprint === '6F20F59D');
            done();
        });
    });
    */
})

app.use(function(req,res){
    res.status(404).send('<div><center> <img src="http://www.phuketontours.com/phuketontours/public/assets/front-end/images/404.gif"/> </center></div>');
});

