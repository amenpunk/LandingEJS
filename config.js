//const MaxTime = 60000
const MaxTime = 30000

module.exports.config = {

    session : {
        secret: process.env.SESSION,
        cookie :{
            maxAge : MaxTime,
            expires : MaxTime
        }
    },
    db : {
        user: process.env.MSSQL_USER,
        password: process.env.MSSQL_PASS,
        server: process.env.MSSQL_SERVER,
        database: process.env.MSSQL_DATABASE,
        encripted : true
    },
}
