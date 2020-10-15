//const MaxTime = 60000
const MaxTime = 60000 * 60 * 24
const multer = require('multer'); 
const sql = require('mssql')
const puppetear = require('puppeteer')

module.exports.config = {
    session : {
        secret: process.env.SESSION,
        cookie :{
            maxAge : MaxTime,
            expires : MaxTime
        }
    },
    storage : multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'FILES/ORIGINAL')
        },
        filename: function (req, file, cb) {
            const id = file.originalname.replace(/\s/g,'')
            cb(null, id)
        }
    }),
    db : () =>  {
        try{
            const connection_config = {
                user: process.env.MSSQL_USER,
                password: process.env.MSSQL_PASS,
                server: process.env.MSSQL_SERVER,
                database: process.env.MSSQL_DATABASE,
                encripted : true
            }
            const pool = new sql.ConnectionPool(connection_config);
            return new Promise((resolve,_rej) => {
                pool.connect().then( c => { 
                    return resolve(c)
                })
            })
        }catch(e){
            console.log(e)
        }
    },
    toPDF : async ( html ) => {
        const browser = await puppetear.launch(); 
        const page = await browser.newPage(); // crear instancia del objeto
        await page.setContent(html)
        const pdf = await page.pdf({
            //''path : '/home/cyberpunk/PDFS/test.pdf',
            format : 'A4', // tamaño de la pagina
            printBackground : true,
            margin: {        // configuracion de margenes para la pagina
                top: "1.5cm",
                right: "1.5cm",
                bottom: "1.5cm",
                left: "1.5cm"
            }
        }, (err, data) => {
            if(err) console.log(err)
            console.log(data)
        })
        return pdf
    }
}
