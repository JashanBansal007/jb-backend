


import dotenv from 'dotenv';

import connectDB from './db/index.js';
//require('dotenv').config({path: './env'});

dotenv.config({
    path: './env'
})

connectDB()
.then(() => 
    {
        app.listen(process.env.PORT || 8000, () => {
            console.log('server is running at port: ${process.env.PORT}'); 
        });
    })
.catch((err) => {
    console.log('MongoDb connection failed',err);
})