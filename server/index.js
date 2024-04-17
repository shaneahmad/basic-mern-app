const express = require('express')
const dotenv = require("dotenv")
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')
const connectDB = require('./config/db')
const User = require("./models/user.model")
const bcrypt = require('bcryptjs')

dotenv.config()
app.use(express.json()) 
app.use(cors())

connectDB()

app.get('/', (req, res) => {

    res.send("Hello World");
})

app.post('/api/register', async (req, res) =>{
    // console.log(req.body);
    const newPassword = await bcrypt.hash(req.body.password, 10);
    try{
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: newPassword
        });
        res.json({status: "ok"})
    }
    catch(err){
        res.json({status: 'error', error: 'Duplicate email'})
    }
})

app.post('/api/login', async (req, res) =>{
        const user = await User.findOne({
            email: req.body.email, 
        })

        if(!user){
            return {status: 'error', error: 'Invalid login'}
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, user.password)

        if(isPasswordValid){
            const token = jwt.sign(
                {
                    name: user.name,
                    email: user.email,
                },process.env.JWT_SECRET_KEY
            )
            return res.json({status: 'ok', user: token})
        }
        else{
            return res.json({status: 'error', user: false})
        }
})

app.get('/api/quote', async (req, res) =>{

    const token = req.headers['x-access-token']

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const email = decoded.email
        const user = await User.findOne({email: email})
        return res.json({status: 'ok', quote: user.quote})
    }catch(error){
        console.log(error)
        res.json({status: 'error', error: 'invalid token'})
    }
})

app.post('/api/quote', async (req, res) =>{

    const token = req.headers['x-access-token']

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const email = decoded.email

        await User.updateOne(
            {email: email},
            {$set:{quote: req.body.quote}} 
        )
        console.log(req,body.quote)
        return res.json({status: 'ok', quote: req.body.quote})
    }catch(error){
        console.log(error)
        res.json({status: 'error', error: 'invalid token'})
    }
})


app.listen(5000,  () =>{
    console.log('Server started on port 5000')
})