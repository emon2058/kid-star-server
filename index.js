const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRECT)

const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l2twi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();
        const database = client.db('kidstar');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');

        app.get('/products',async(req,res)=>{
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            console.log(products)
            res.json(products)
        })

        app.post('/products',async(req,res)=>{
            const product = req.body;
            // console.log(product)
            const result = await productsCollection.insertOne(product)
            res.json(product)
        })
        app.get('/product/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const product = await productsCollection.findOne(query);
            res.send(product)
        })

        app.get('/orders',async(req,res)=>{
            const email = req.query.email;
            const query = {email:email};
            const cursor = ordersCollection.find(email?query:{});
            const orders = await cursor.toArray();
            res.json(orders)
        })
        app.get('/orders/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await ordersCollection.findOne(query);
            res.json(result)
        })
        app.delete('/orders/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await ordersCollection.deleteOne(query);
            console.log('delete',result,query,id)
            res.json(result)
        })
        app.get('/reviews',async(req,res)=>{
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews)
        })

        app.get('/users/:email',async(req,res)=>{
            const email = req.params.email;
            const query = {email:email}
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if(user?.role==='admin'){
                isAdmin=true;
            }
            res.json({admin:isAdmin})
        })

        app.post('/users',async(req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log('user',result)
            res.json(result)
        })

        app.put('/users',async(req,res)=>{
            const user = req.body;
            const filter={email:user.email};
            const updateDoc = {$set:user};
            const options = {upsert:true};
            const result = await usersCollection.updateOne(filter,updateDoc,options);
            res.json(result)
        })
        app.put('/users/admin',async(req,res)=>{
            const user = req.body;
            const filter = {email:user.email};
            const updateDoc = {$set:{role:'admin'}};
            const result = await usersCollection.updateOne(filter,updateDoc);
            res.json(result)
        })

        app.post('/orders',async(req,res)=>{
            const orders = req.body;
            const result = await ordersCollection.insertOne(orders);
            res.json(result)
        })
        app.post('/reviews',async(req,res)=>{
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews)
            res.json(result)
        })

        app.post('/create-payment-intent',async(req,res)=>{
            const paymentInfo = req.body;
            console.log('price', paymentInfo.price)
            const amount  = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency:'usd',
                amount:amount,
                payment_method_types:['card']
            })
            console.log('paymentInfo',{clientSecrect: paymentIntent})
            res.json({clientSecrect: paymentIntent.client_secret})
        })
    }
    finally{
    // await client.close();

    }
}
run().catch(console.dir);

app.get('/',async (req,res)=>{
    res.send('kid star server');
})
app.listen(port,()=>{
    console.log('running port',port);
})