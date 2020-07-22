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

 
app.get('/', async (req, res) => {
    return res.render("index")
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
        return res.render('index')
    }
    const {pass,nombre} = recordset.shift()
    const loged = pass === Buffer.from(password).toString('base64')

    if(!loged){
        return res.render('index')
    }
    sess.loged = true;
    sess.name = nombre;
    return res.status(200).render('home', {
        name : nombre 
    })
})

app.get('/register', (req, res) => {
    return res.render('register')
})

app.post('/save', async (req, res) => {
    
    const { mail, password, nombre } = req.body
    console.log(req.body)
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

    return res.render('login')
})

app.get('/home', (req, res) => {
    sess = req.session;
    if(!sess.loged){
        return res.render('index')
    }
    return res.render('home', { name : sess.name })
})
