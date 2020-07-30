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
        return res.render('home', {name : sess.nombre})
    }

    return res.render('landingpage', { error : false})
})

app.get('/login', async (req, res) => {
    
    sess = req.session;
    const register = req.query.name ? true : false
    
    if(sess.loged){
        return res.render('home', {name : sess.name, nuevo : register})
    }
    return res.render("loginForm", {nuevo : register})
})

app.post('/login', async (req, res) => {

    const { mail, password } = req.body
    sess=req.session;

    const result = await sql.connect(config.db).then( pool => {
        return pool.request()
            .input('input_parameter', sql.TYPES.VarChar, mail)
            .query('select * from login where email = @input_parameter')
    }).catch(e => {
        console.log(e)
        return false
    })
    
    const {recordset} = result
    if(recordset.length <= 0){
        return res.render('landingpage', {error : true})
    }
    const {pass,nombre} = recordset.shift()
    const correctLogin = pass === Buffer.from(password).toString('base64')

    if(!correctLogin){
        return res.render('landingpage', {error : true})
    }
    sess.loged = true;
    sess.nombre = nombre;
    return res.redirect('home')
})

app.get('/home', (req, res)=> {
    sess = req.session;
    if(!sess.loged){
        return res.render('landingpage', {error : false})
    }
    return res.render('home', { name : sess.nombre })
})

app.post('/save', async (req, res) => {
    
    sess=req.session;
    const { mail, password, nombre, phone } = req.body

    const pass = Buffer.from(password).toString('base64')

    const result = await sql.connect(config.db).then( pool => {
           return pool.request()
            .input('mail', sql.TYPES.VarChar, mail)
            .input('pass', sql.TYPES.VarChar, pass)
            .input('nombre', sql.TYPES.VarChar, nombre)
            .input('phone', sql.TYPES.VarChar, phone)
            .query('insert into login(nombre, email, pass, phone) values(@nombre, @mail, @pass, @phone)')
        }).catch(e => {
            console.log(e)
            return false
        })
    
    sess.nombre = nombre
    sess.loged = true;
    return res.redirect('home');
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
    console.log(result.data)
    const {success } = result.data

    if(!success) {
        return res.status(200).json({
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

app.use(function(req,res){
    res.status(404).send('<div><center> <img src="http://www.phuketontours.com/phuketontours/public/assets/front-end/images/404.gif"/> </center></div>');
});

