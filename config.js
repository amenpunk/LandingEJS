const MaxTime = 60000
//const twilio = require('twilio')(process.env.TWILIO_ACCOUNT, process.env.TWILIO_TOKEN);

module.exports.config = {

    session : {
        secret: process.env.SESSION,
        cookie :{
            maxAge : new Date(Date.now() + MaxTime),
            expires : MaxTime
        }
    },
    db : {
        user: process.env.MSSQL_USER,
        password: process.env.MSSQL_PASS,
        server: process.env.MSSQL_SERVER,
        database: process.env.MSSQ_DATABASE,
        encripted : true
    },
}