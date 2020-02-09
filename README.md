# **Iota**
This is the Iota mongodb class that is common among several processes/repos. We are trying it out as a separate repo to see what the advantages/disadvantage are of doing it this way.

It extends mongo-models which is a light wrapper around mongodb to make a few things easier.  
## Usage

    var Iota=require("iota")([list of docs to initialze collection with - if it is empty]);

also, if you aren't doing MongoModels.connect() anywhere else, you can do:

    await Iota.connectInit(); 

Note, it's important to await in order to make sure that the database is connect before functions that require the db are executed.

this should only be done in one place in a project.  Everywhere else use:

    var Iota=require("iota")();

## doc definition
    _id: Joi.object(),
    path: Joi.string(),  The path, beginning with '/' that pulls up this document
    subject: Joi.string().required(), A one line headline for what this document describes
    description: Joi.string().required(),   A a paragraph description of what this document describes
    webComponent: [Joi.string(),Joi.object()], The name of a webComponent in app/components/web-components, or an object with a property webComponent set to that name, and all the other properties of the object will be passed props to the webComponent
    participants: Joi.object(), a list of participants in the discussion
    component: Joi.object(), The name of a components 
    userId: Joi.string(), The mongodb userId document _id as a string
    parentId: Joi.string(), The parent document _id as a string
    bp_info: Joi.object(), some ballotpedia info


## API

The mongo-models API can be found here: https://github.com/jedireza/mongo-models/blob/master/API.md

