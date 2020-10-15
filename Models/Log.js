'use strict'
const sql = require('mssql')
const { config } = require("../config")

const today = new Date();


const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
const dateNow = mm + "/" + dd + "/" + yyyy;

const hour = today.getHours() 
const minutos = today.getMinutes() 
const hora = `${hour}:${minutos}`

class Log { 
    constructor(log){
        this.mark = new Date();
        this.event = log.event;
        this.usuario =  log.usuario; 
        this.file_name = log.file_name; 
        this.file_type = log.file_type;
        this.name = log.name;
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
                .input('name', sql.TYPES.VarChar,this.name)
                .query('insert into file_logs(mark, event, usuario, file_name, file_type, name) values(GETDATE(),@event, @usuario, @file_name, @file_type, @name)')
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
                    .query("select * from file_logs where event='UPLOAD' ")
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
    static MailLog(Info){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('fecha', sql.TYPES.VarChar, dateNow )
                    .input('estado', sql.TYPES.VarChar, Info.estado )
                    .input('destino', sql.TYPES.VarChar, Info.destino )
                    .input('origen', sql.TYPES.VarChar, Info.origen)
                    .input('departamento', sql.TYPES.VarChar, Info.departamento )
                    .input('motivo', sql.TYPES.VarChar, Info.motivo )
                    .query("insert into mail_log values(@fecha,@estado,@destino,@origen,@departamento,@motivo)")
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
    static getMails(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .query("select * from mail_log")
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
    static LoginLog(user){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('fecha', sql.TYPES.VarChar, dateNow )
                    .input('hora', sql.TYPES.VarChar, hora )
                    .input('usuario', sql.TYPES.Int, user )
                    .query("insert into login_log(fecha,hora,id) values(@fecha,@hora,@usuario)")
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
    static getLogins(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .query("select * from login_log l inner join login u on u.id = l.id inner join role r on r.id = u.id")
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
    static getFileLogs(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .query("select * from file_logs")
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
