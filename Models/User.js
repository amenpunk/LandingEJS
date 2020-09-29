'use strict'
const sql = require('mssql')
const { config } = require("../config")

class User {
    constructor(user){
        this.nombre = user.nombre;
        this.email = user.email;
        this.password = user.password;
        this.phone = user.phone;
        this.code = user.code;
    }
    print(){
        console.log(this)
    }
    save(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('nombre', sql.TYPES.VarChar, this.nombre)
                    .input('mail', sql.TYPES.VarChar, this.email)
                    .input('pass', sql.TYPES.VarChar, this.password)
                    .input('phone', sql.TYPES.VarChar, this.phone)
                    .input('code', sql.TYPES.VarChar, this.code)
                    .query('insert into login(nombre, email, pass, phone, code) values(@nombre, @mail, @pass, @phone, @code )')
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
    static isInBlackList(mail){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('mail', sql.TYPES.VarChar, mail)
                    .query('select * from blacklist where mail = @mail')
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
    static verifyCredentials(mail){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('input_parameter', sql.TYPES.VarChar, mail)
                    .query('select * from login l inner join role r on l.id = r.id where email=@input_parameter')
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
                    .query('select * from login l inner join role r on l.id = r.id')
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


module.exports = { User }
