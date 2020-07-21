const expres = require("express")
const app = expres()
const PORT = process.env.PORT || 8080;
const dotenv = require('dotenv');
dotenv.config();

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
    console.log( process.env.MSSQL_PASS)
    let pool = await sql.connect(db_config)
    let result1 = await pool.request()
        .input('input_parameter', sql.Int, 1)
        .query('select * from login where id_user = @input_parameter')
    console.log(result1)

    return res.render("index")
})

app.post('/login', (req, res) => {
    console.log(req.body)
    return res.render('login')
})

app.post('/home', (req, res) => {
    console.log(req.body)
    return res.render('home')
})
