const expres = require("express")
const app = expres()
const PORT = process.env.PORT || 8080;
const dotenv = require('dotenv');
dotenv.config();
const session = require('express-session');
app.use(session({secret: process.env.SESSION}));
let sess


app.use(expres.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

app.listen(PORT, () => {
    console.log(`APP listen in port ${PORT}`)
})

const sql = require('mssql')

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

    
    let pool = await sql.connect(db_config)
    let query = await pool.request()
        .input('input_parameter', sql.TYPES.VarChar, mail)
        .query('select * from login where email = @input_parameter')

    const {recordset} = query
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

app.get('/home', (req, res) => {
    sess = req.session;
    if(!sess.loged){
        return res.render('index')
    }
    return res.render('home', { name : sess.name })
})
