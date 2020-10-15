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
const { User, Role, Log, File, PNC } = require("./Models")
const GPG = require("gpg")
const Stream = require('stream');
const ejs = require('ejs')
const puppetear = require('puppeteer')
const  { Readable }  = require('stream') 



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
app.use(bodyParser.urlencoded({extended: false}));


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
    
    console.log('register', register)
    let allRoles
    if(register){
        let query = await Role.get();
        console.log(query)
        allRoles = query.recordset;
    }
    return res.render("loginForm", {nuevo : register, roles : allRoles})
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
    console.log("usuario: ",recordset)
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
    let { mail: email , password , nombre, phone, role } = req.body
    
    let puesto;
    const query = await Role.get();
    const {recordset} = query;
    
    const role_info = recordset.filter( r => r.id === parseInt( role) ).shift();

    const max = 999999
    const min = 100000
    const code = (Math.random() * (max - min) + min).toFixed(0)

    
    const user = new User({ email, password, nombre, phone, code, role : role_info.access_code, dep : role_info.name })
    /*const write = await user.fileScript();
    
    if(!write.status){ 
        return res.render("loginForm", {nuevo : true})
    }
    
    user.ruta = write.file
    //const firma = await user.generateGPG();
    //const finger = await User.getFingerprint(firma);
    user.GPG = finger
    */
    user.password = Buffer.from(password).toString('base64')
    const result = await user.save();
    const setRole = await user.setRole()
    
    const mailOptions = {
        from: process.env.GMAIL,
        to: email,
        subject: 'Landing Page', 
        html: `<h1>Bienvenido</h1> <br> ingresa con el siguiente codigo: ${code}`
    };
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
            console.log(err)
        else
            console.log(info);
    });
    /*
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

app.get('/logout', (req,res) => {
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

    const {id, access_code, puesto} = req.body;
    const role = new Role({id, access_code, puesto})
    role.print();
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

app.post('/userPDF', async function(req, res){ 
    
    const {start, end, departamento : type} = req.body;
    let query = await User.getAll();
    let Users = query.recordset;

    console.log(type)
    if(type && type.length > 0){
        Users = Users.filter(u => u.departamento === type)
    }
    console.log(start, end)
    if(start && end){
        Users = Users.filter(u => {
            let created_at = new Date(u.fecha)
            return created_at < new Date(end) && created_at > new Date(start)
        })
    }
    
    ejs.renderFile('./views/userPDF.ejs', { Titulo : "Reporte de Usuarios",  Users }, {}, async function(err, html)  {
        if(err) console.log(err)

        let create = await config.toPDF(html);
        const buffer = new Buffer(create)
        const readable = new Readable()
        readable._read = (e) => { console.log(e) } 
        readable.push(buffer)
        readable.push(null)

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        readable.pipe(res)
    })   
})

app.post('/mailPDF', async function(req, res){ 
    
    const { estado_correo ,start, end, departamento : type} = req.body;
    let query = await Log.getMails()
    let Mails = query.recordset;

    if(type && type.length > 0){
        Mails = Mails.filter(u => u.departamento === type)
    }

    console.log(start, end)
    if(start && end){
        Mails = Mails.filter(u => {
            let created_at = new Date(u.fecha)
            return created_at < new Date(end) && created_at > new Date(start)
        })
    }
    
    Mails = Mails.filter( m => m.estado === estado_correo )
    
    ejs.renderFile('./views/mailPDF.ejs', { Titulo : "Reporte Correos",  Mails }, {}, async function(err, html)  {
        if(err) console.log(err)

        let create = await config.toPDF(html);
        const buffer = new Buffer(create)
        const readable = new Readable()
        readable._read = (e) => { console.log(e) } 
        readable.push(buffer)
        readable.push(null)

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        readable.pipe(res)
    })   
})



app.get('/reportes', async function(req, res){
    sess = req.session;
    if(!sess.loged){ return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }}) }
    let permiso = sess.access.split("");
    if(parseInt(permiso[0]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede ver reportes" }})
    }


    let query = await Role.get();
    let Roles = query.recordset;

    return res.render('pdf', {  Roles })
})

app.get('/pnc', async function(req, res){
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    
    let permiso = sess.access.split("");
    
    if(parseInt(permiso[0]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede subir agregar PNC :(" }})
    }
    let userlist = await User.getAll();
    const {recordset : usuarios} = userlist;
    let roles = usuarios.map( u => u.departamento )
    let puestos = ["",...new Set(roles)]
    return res.render('PNC', { puestos })
})

app.post('/UserList', async(req,res) => {
    const {role} = req.body;
    let all = await User.getAll();
    const {recordset : userlist } = all
    let role_list = userlist.filter( u => u.departamento === role )
    return res.send(role_list)
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

app.post('/createPNC', upload.single('myFile'), async (req, res) => {
    try{
        const { user, reason, puesto } = req.body;
        console.log(req.body)
        sess = req.session;
        const file = req.file
        console.log("file", file)
        const id_requestor = sess.id_user
        const filename = file.originalname.replace(/\s/g,'')
        const pnc = new PNC({ requestor : id_requestor, destiny : parseInt(user), reason, evidence : filename })
        pnc.print();
        await pnc.save();

        const snapUser = await User.get(parseInt(user))
        const { recordset : responsable } = snapUser;

        const {email : go_mail, nombre : go_name } = responsable.shift();

        let ATTACH = [
            {
                filename: filename,
                path: 'FILES/ORIGINAL/'+filename,
                contentType: file.mimetype
            }
        ]

        let mailDetails = {
            from: process.env.GMAIL,
            to: go_mail,
            subject: `New PNC`,
            text : reason,
            attachments: ATTACH
        };
    
        transporter.sendMail(mailDetails, function (err, info) {
            if(err){

                let Info = {
                    destino : go_mail,
                    origen : sess.nombre,
                    departamento :  puesto,
                    motivo : reason, 
                    estado : "FAIL"
                }
                Log.MailLog(Info)

            }
            else{
                let Info = {
                    destino : go_mail,
                    origen : sess.nombre,
                    departamento :  puesto,
                    motivo : reason, 
                    estado : "SUCCESS"
                }
                Log.MailLog(Info)
                console.log(f)

            }
        });

        return res.send(`<div style="font-size:30px"><center><h1>Tu archivo se esta subiendo.....</h1><script> setTimeout(function(){ window.location.href = '/monitoring' },3000); </script> <img src="https://tradinglatam.com/wp-content/uploads/2019/04/loading-gif-png-4.gif"/> </center></div>`);

    }catch(e){
        console.log(e)
    }

})

app.post('/upload', upload.single('myFile'), async (req, res) => {
    
    try{
        const file = req.file
        const { GPG : TO } = req.body
        console.log("Author:", sess.finger)
        console.log("singed to:", TO )
        
        sess = req.session;
        const id = file.originalname.replace(/\s/g,'')
        sess.file = id;
        
        /*
        const buffe_file = new Promise((resolve, _r) => {
            fs.readFile( 'FILES/ORIGINAL/'+ id , function(err, file) { 
                if(err){
                    console.log(err)
                    return resolve(err)
                } 
                return resolve(file)
            })
        })
        
        const buffer = await Promise.resolve(buffe_file)
        var args = [
            '--default-key', sess.finger,
            '--recipient', TO,
            '--armor',
            '--trust-model', 'always', 
        ];
        
        const save = new Promise((resolve, reject) => {
            GPG.encrypt(buffer, args, function(err, encrypted){
                if(err) return res.send({status : err})
                fs.writeFile( process.env.SECRET_DIR + id , encrypted , (err) => {
                    if (err) return resolve({status : false})
                    console.log('archivo encriptado');
                    return resolve({status : true})
                })
            });
        })

        const encryptFile = await Promise.resolve(save)
        await fs.unlinkSync('FILES/ORIGINAL/'+ id)
        */

        if (!file) {
            return res.send(`<div style="font-size:30px"><center><h1>El archivo ingresado no es valido </h1><script> setTimeout(function(){ window.location.href = '/upload'; },3000); </script> <img src="http://www.phuketontours.com/phuketontours/public/assets/front-end/images/404.gif"/> </center></div>`);
        }

        const log = new Log({ event : "UPLOAD", usuario : sess.id_user, file_name : id , file_type : file.mimetype, name : file.originalname })
        const file_save = new File({ origin : sess.finger, destiny : TO, name : file.originalname, type : file.mimetype, original_name : id })
        file_save.print();
       
        Promise.all([ log.save(), file_save.save() ])
        
        return res.status(200).send(`<div style="font-size:30px"><center><h1>Tu archivo se esta subiendo.....</h1><script> setTimeout(function(){ window.location.href = '/files' },3000); </script> <img src="https://tradinglatam.com/wp-content/uploads/2019/04/loading-gif-png-4.gif"/> </center></div>`);

    }catch(e){
        console.log("error al subir el archivo:", e.message)
        return res.redirect('/', {error: e.message})
    }
})

app.get('/download/:name', function(req, res){
//app.get('/download/:name/:id_origin/:id_dest', function(req, res){
    
    const name = req.params.name
    /*
    const id_origin = req.params.id_origin
    const id_dest = req.params.id_dest

    console.log({id_dest,id_origin})
    sess = req.session;
    
    const args = [
        '--decrypt',
        '--default-key', id_origin,
        '--recipient', id_dest,
        '--trust-model', 'always', // so we don't get "no assurance this key belongs to the given user"
    ];
    */
    
    var file = __dirname + `/FILES/ORIGINAL/${name}`;
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
    console.log("person who go to decript: ", sess )

    
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    let permiso = sess.access.split("");

    if(parseInt(permiso[0]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede ver los archivos :(" }})
    }

    const list = await File.getAll(sess.finger);
    const {recordset : Files} = list
    return res.render('files', { Files })
})

app.get('/monitoring', async (req,res) => {
    
    sess = req.session;
    
    if(!sess.loged){
        return res.render('landingpage', {error : { status : true , message : "Logeate para ver el contenido" }})
    }
    let permiso = sess.access.split("");

    if(parseInt(permiso[0]) !== 1 ){
        return res.render('home', {name : sess.nombre , error : { status : true , message : "Tu usuario no puede darle seguimiento a los PNC" }})
    }

    const list = await PNC.getAll();
    const {recordset : pnc} = list
    console.log(pnc)
    return res.render('Monitoring', {pnc})
})

app.get("/updatePNC/:id/:status", async (req,res) => {
    const id = req.params.id
    const estado = parseInt(req.params.status) 

    switch(estado){
        case 0 : {
            await PNC.delete(id)
            break;
        }
        case 1 : {
            await PNC.update(id, 1)
            break;
        }
        case 2 : {
            await PNC.update(id, 0)
            break;
        }
    }
    
    return res.send(`<div style="font-size:30px"><center><h1>Cambiado el estado del PNC.....</h1><script> setTimeout(function(){ window.location.href = '/monitoring' },3000); </script> <img src="https://tradinglatam.com/wp-content/uploads/2019/04/loading-gif-png-4.gif"/> </center></div>`);

})

app.post("/gps", (req,res) => {
    console.log({time : new Date().toLocaleTimeString(), body :req.body })
    return res.send({status : true})
})

app.post("/gps_stop", (req,res) => {
    console.log({time : new Date().toLocaleTimeString(), status : "GPS STOPED" })
    return res.send({status : false})
})

app.get('/pdf', async (req,res) => {
    try{
        ejs.renderFile('./views/pdf.ejs', { title : "puta madre" }, {}, async function(err, html)  {
            if(err) console.log(err)
            
            let create = await config.toPDF(html);
            const buffer = new Buffer(create)
            const readable = new Readable()
            readable._read = (e) => { console.log(e) } 
            readable.push(buffer)
            readable.push(null)

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
            readable.pipe(res)
        })   

    }catch(e){
        console.log(e)
        return res.end()
    }

})
