const expres = require("express")
const app = expres()
const PORT = process.env.PORT || 8080;
const dotenv = require('dotenv');
dotenv.config();
const sql = require('mssql')
const session = require('express-session');
app.use(session({secret: process.env.SESSION}));
let sess

app.use(expres.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(expres.static('public'));


app.listen(PORT, () => {
    console.log(`APP listen in port ${PORT}`)
})

const db_config = {
    user: "mingsql",
    password: process.env.MSSQL_PASS,
    server: "mingsql.database.windows.net",
    database: "landing",
    encripted : true
}
 
app.get('/', (req, res) => {
    sess = req.session;
    
    if(sess.loged){
        return res.render('home', {name : sess.nombre})
    }
    
    return res.render('landingpage', { error : false})
})

app.get('/loginForm', async (req, res) => {
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

    const result = await sql.connect(db_config).then( pool => {
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
    const loged = pass === Buffer.from(password).toString('base64')

    if(!loged){
        return res.render('index')
    }
    sess.loged = true;
    sess.nombre = nombre;
    return res.status(200).render('home', {
        name : nombre 
    })
})

app.get('/register', (req, res) => {
    sess = req.session;
    return res.render('register')
})


app.get('/home', (req, res)=> {
    sess = req.session;
    console.log(sess.nombre)
    return res.render('home', { name : sess.nombre })
})

app.post('/save', async (req, res) => {
    
    sess=req.session;
    const { mail, password, nombre } = req.body
    sess.nombre = nombre
    sess.loged = true;

    const pass = Buffer.from(password).toString('base64')

    const result = await sql.connect(db_config).then( pool => {
           return pool.request()
            .input('mail', sql.TYPES.VarChar, mail)
            .input('pass', sql.TYPES.VarChar, pass)
            .input('nombre', sql.TYPES.VarChar, nombre)
            .query('insert into login(nombre, email, pass) values(@nombre, @mail, @pass)')
        }).catch(e => {
            console.log(e)
            return false
        })

    return res.render('home', {name :nombre})
})

app.get('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });
})

