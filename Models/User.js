'use strict'
const sql = require('mssql')
const { config } = require("../config")
const fs = require("fs")
const path = require('path');
const { exec } = require("child_process")
const GPG = require("gpg")

class User {
    constructor(user){
        this.nombre = user.nombre;
        this.email = user.email;
        this.password = user.password;
        this.phone = user.phone;
        this.code = user.code;
        this.ruta = user.ruta;
        this.GPG = user.GPG
        this.role = user.role
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
                    .input('GPG', sql.TYPES.Text, this.GPG)
                    .query('insert into login(nombre, email, pass, phone, code, GPG) values(@nombre, @mail, @pass, @phone, @code, @GPG )')
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
    fileScript(){
        return new Promise((resolve,_rect) => {
            const script = "Key-Type: 1 \n" +
                "Key-Length: 2048 \n" +
                "Subkey-Type: 1 \n" +
                "Subkey-Length: 2048 \n"+
                "Name-Real: " + this.nombre + "\n" +
                "Name-Email: " + this.email + "\n" + 
                "Expire-Date: 0\n" +
                "Passphrase: " + this.password;
            
            const rute =  `/tmp/${this.code}_get_key`
            fs.writeFile(rute, script , (err) => {
                if(err){
                    resolve({status : false}) 
                }
                resolve({status : true, file : rute})
            }) 
        })
    }
    generateGPG(){
        return new Promise((res,_rej) => {
            const file = exec(`gpg --gen-key --batch ${this.ruta}`, (err, stdout, stderr) => {
                if(err){
                    console.error(stderr)
                    return res(stderr)
                }
                exec(`gpg --armor --export ${this.email}`,(err, key, exception) => {
                    if(err){
                        console.error(exception)
                        return res(exception)
                    }
                    return res(key)
                })
            })
        })
    }
    static getFingerprint(gpgKey){
        return new Promise((resolve,_r) => {
            GPG.importKey(gpgKey, function(importErr, result, fingerprint) {
                return resolve(fingerprint)
            });
        })
    }
    setRole(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('access_code', sql.TYPES.VarChar, this.role)
                    .execute('setRole')
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
