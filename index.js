'use strict';
const Joi = require("@hapi/joi");
const mongodb=require('mongodb'); // it's a peer requirement
const MongoModels = require('mongo-models');

/**
 * 
 * Usage:
 * 
 * var Iota=require('./iota')([initial records if collection doesn't yet exist]);
 * 
 * or
 * 
 * var Iota=require('./iota)(); for most cases
 * 
 */


// if logger is not included in the project
if(typeof logger==='undefined'){
    var logger={
        trace: console.trace,
        info: console.info,
        warn: console.warn,
        error: console.error
    }
}
 
const schema = Joi.object({
    _id: Joi.object(),
    path: Joi.string(),
    subject: Joi.string().required(),
    description: Joi.string().required(),   
    webComponent: [Joi.string(),Joi.object()],
    participants: Joi.object(),
    component: Joi.object(),
    userId: Joi.string(),
    parentId: Joi.string(),
    bp_info: Joi.object()
});
 
class Iota extends MongoModels {
    static connectInit(){
        return new Promise((ok,ko)=>{
            let retries=3;
            async function tryConnect(){
                try{
                    if(!MongoModels.toInit) MongoModels.toInit=[];
                    await MongoModels.connect({uri: process.env.MONGODB_URI},{});
                    if(!MongoModels.toInit.length) return ok();
                }
                catch(err){
                    logger.error("connectInit caught error trying to connect to MongoModels:", err.message);
                    if(--retries>0) 
                        setTimeout(tryConnect,5000); // we might need to wait for the server to start up
                    else
                        ko(err);
                    return;
                }
                try {
                    while (MongoModels.toInit.length){  // any models that need to createIndexes will push their init function
                        await MongoModels.toInit.shift()();
                        return ok();
                    }
                }
                catch(err){
                    logger.error("connectInit caught error trying to init", err.message);
                    ko(err);
                }
            }
            tryConnect();
        })
    }
    static create(obj) {
        return new Promise(async (ok,ko)=>{
            try {
                const doc = new Iota(obj);
                const result=await this.insertOne(doc);
                if(result && result.length===1)
                    ok(result[0]);
                else {
                    const msg=`unexpected number of results received ${results.length}`
                    logger.error(msg)
                    ko(new Error(msg));
                }
            }
            catch(err){
                logger.error(`Iota.create caught error:`,err)
                ko(err);
            }
        })
    }
}
 
Iota.collectionName = 'iotas'; // the mongodb collection name
Iota.schema = schema;
Iota.indexes=[{key: {path: 1}, name: 'path', unique: true, partialFilterExpression: {path: {$exists: true}} }];

async function init(initialRecords){
    return new Promise(async (ok,ko)=>{
        try {
            await Iota.createIndexes(Iota.indexes);
            var count=await Iota.count();
            logger.info("Iota.init count",count)
            if(count || !initialRecords || !initialRecords.length) return ok();
            initialRecords.forEach(i=>{
                switch(typeof i._id){
                    case "undefined":
                        break;
                    case "string":
                        i._id=Iota.ObjectID(i._id);
                        break;
                    case "object":
                        i._id=Iota.ObjectID(i._id.$oid);
                        break;
                }
            }); // convert object _id's to objects
            var writeResult=await Iota.insertMany(initialRecords);
            if(!writeResult || !writeResult.length){
                logger.error("Iota.init error initializing collection");
                return ko(new Error("Iota.init error initializing collection"))
            }else{
                logger.info("Iota.init collection initialized with", writeResult.length, "documents");
                return ok();
            }
        }
        catch(err) {
            logger.error("Iota.createIndexes error:", err)
            ko(err);
        }
    })
}

var initialized=false;

function createIota(initialRecords){
    if(!initialized) {
        initialized=true; // so we don't come this again even if there are multiple require('iota')() in a project.
        if(MongoModels.dbs['default']) init(initialRecords);
        else if(MongoModels.toInit) MongoModels.toInit.push(()=>init(initialRecords));
        else {
            MongoModels.toInit=[()=>init(initialRecords)];
        }
    }
    return Iota;
}

module.exports = createIota;