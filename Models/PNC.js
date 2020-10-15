'use strict'
const sql = require('mssql')
const { config } = require("../config")

class PNC { 
    constructor(pnc){
        this.requestor = pnc.requestor
        this.destiny = pnc.destiny
        this.reason = pnc.reason
        this.evidence = pnc.evidence
        this.timestamp = new Date().toUTCString()
    }
    print(){
        console.log(this)
    }
    save(){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('requestor', sql.TYPES.Int, this.requestor)
                    .input('destiny', sql.TYPES.Int, this.destiny  )
                    .input('reason', sql.TYPES.Text, this.reason )
                    .input('evidence', sql.TYPES.VarChar, this.evidence )
                    .input('timestamp', sql.TYPES.VarChar,this.timestamp)
                    .query('insert into PNC(requestor, destiny, reason, evidence, timestamp, status) values(@requestor, @destiny, @reason, @evidence, @timestamp, 0 )')
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
                    .query('select * from PNC')
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
    static delete(id){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('id', sql.TYPES.Int, id)
                    .query('delete from PNC where id=@id')
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
    static update(id, estado){
        return new Promise((res,_rej) => {
            return config.db().then( db => {
                db.request()
                    .input('id', sql.TYPES.Int, id)
                    .input('status', sql.TYPES.Int, estado)
                    .query('update PNC set status=@status where id=@id')
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

module.exports = { PNC }
