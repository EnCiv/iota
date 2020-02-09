"use strict;"
const {spawn, exec}=require('child_process')
const util=require('util');
const pexec = util.promisify(exec);
const MongoModels = require('mongo-models');

function startUp() {
    return new Promise(async (ok,ko)=>{
        try{
            const { stdout, stderr } = await pexec('mkdir tmp');
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
        }
        catch(err){
            if(err.code!==1){
                console.info(err);
                ko(err);
            } 
            //else just fall through and continue
        }

        const dbPipe = spawn('mongod', ['--dbpath=./tmp', '--port', '27017'])
        dbPipe.stdout.on('data', function (data) {
            console.log(data.toString('utf8'));
        });
        
        dbPipe.stderr.on('data', (data) => {
            console.log(data.toString('utf8'));
        });
        
        dbPipe.on('close', (code) => {
            console.info('Process exited with code: '+ code);
        });

        ok();
    })
}

function shutDown(){
    return new Promise(async (ok,ko)=>{
        MongoModels.disconnect(); // make sure everything gets flushed before killing the db
        const shutdown=spawn('mongo', ['--eval', "db.getSiblingDB('admin').shutdownServer();quit()"]);
        shutdown.on('close',code=>{
            if(!code) return ok();
            console.error('Shutdown process exited with code', code);
            ko();
        })
    })
}

const iotas=[
    {
        path: '/the-beginning',
        subject: 'this is the beginning',
        description: 'this is the beginning of an iota test',   
        webComponent: "webComponent",
        participants: {moderator: "me", participan1: "them"},
        component: {component: 'data-component'},
        userId: 'abc123',
        parentId: '123abc',
        bp_info: {election_date: "2020_11_05"}
    }
];

async function testIt(){
    await startUp();
    const Iota=require('./index')(iotas)
    await Iota.connectInit();
    var doc=await Iota.findOne({path: '/the-beginning'});
    console.info("doc:", doc);
    await shutDown();
}

process.env.MONGODB_URI="mongodb://localhost:27017/tmp?connectTimeoutMS=3000000"

testIt();

