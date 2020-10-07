'use strict'
const sql = require('mssql')
const { config } = require("../config")

class File { 
    constructor(file){
        this.origin = file.origin
        this.destiny = file.destiny,
        this.name = file.name
        this.type =file.type
        this.original_name = file.original_name
    }
    print(){
        console.log(this);
    }
    save(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                .input('origin', sql.TYPES.VarChar, this.origin)
                .input('destiny', sql.TYPES.VarChar, this.destiny )
                .input('name', sql.TYPES.VarChar, this.name )
                .input('type', sql.TYPES.VarChar, this.type )
                .input('original_name', sql.TYPES.VarChar,this.original_name)
                .query('insert into files(id_origin, id_dest, file_name, file_type, name) values(@origin, @destiny, @name, @type, @original_name )')
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
    static getAll(destiny){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('destiny', sql.TYPES.VarChar, destiny)
                    .query("select * from files where id_dest=@destiny or id_origin=@destiny")
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

module.exports = { File }
