'use strict'
const sql = require('mssql')
const { config } = require("../config")

class Role { 
    constructor(role){
        this.id = role.id
        this.access_code = role.access_code
        this.departamento = role.departamento
        this.puesto = role.puesto
    }
    print(){
        console.log(this)
    }
    update(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('id', sql.TYPES.VarChar, this.id )
                    .input('access_code', sql.TYPES.VarChar, this.access_code )
                    .query('update role set access_code=(@access_code) where id=(@id)')
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
    static get(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .query('select * from section')
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

module.exports = { Role }
