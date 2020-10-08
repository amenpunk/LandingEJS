'use strict'
const sql = require('mssql')
const { config } = require("../config")

class PNC { 
    constructor(pnc){
        this.requestor = pnc.requestor
        this.destiny = pnc.destiny
        this.reason = pnc.reason
        this.evidence = pnc.evidence
        this.timestamp = new Date().toLocaleTimeString()
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
                    .query('insert into PNC(requestor, destiny, reason, evidence, timestamp, status) values(@requestor, @destiny, @reason, @evidence, @timestamp, false )')
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
