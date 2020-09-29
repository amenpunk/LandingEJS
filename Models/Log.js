'use strict'
const sql = require('mssql')
const { config } = require("../config")

class Log { 
    constructor(log){
        this.mark = new Date();
        this.event = log.event;
        this.usuario =  log.usuario; 
        this.file_name = log.file_name; 
        this.file_type = log.file_type;
    }
    print(){
        console.log(this)
    }
    save(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                .input('event', sql.TYPES.VarChar, this.event)
                .input('usuario', sql.TYPES.Int, this.usuario )
                .input('file_name', sql.TYPES.VarChar, this.file_name )
                .input('file_type', sql.TYPES.VarChar, this.file_type )
                .query('insert into file_logs(mark, event, usuario, file_name, file_type) values(GETDATE(),@event, @usuario, @file_name, @file_type)')
                    .then( data => {
                        return res(data)
                    })
                    .catch( e => {
                        console.log(e)
                        return res(e)
                    })
            })
        })

    }
    static getAll(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .query('select * from file_logs')
                    .then( data => {
                        return res(data)
                    })
                    .catch( e => {
                        console.log(e)
                        return res(e)
                    })
            })
        })
    }
}

module.exports = { Log }
