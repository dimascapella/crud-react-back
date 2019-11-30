const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const todoRoutes = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PORT = 8000;

process.env.SECRET_KEY = 'secret'

let Todo = require('./todo.model');

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/todos', { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection;
connection.once('open', function () {
    console.log("MongoDB Database Connected");
})

todoRoutes.route('/').get(function (req, res) {
    Todo.find(function (err, todos) {
        if (err) {
            console.log(err);
        } else {
            res.json(todos);
        }
    })
})

todoRoutes.route('/:id').get(function (req, res) {
    Todo.findById(req.params.id, function (err, todo) {
        res.json(todo);
    })
})

todoRoutes.route('/add').post(function (req, res) {
    let todo = new Todo(req.body);
    todo.save()
        .then(todo => {
            res.status(200).json({ 'todo': 'todo added' });
        })
        .catch(err => {
            res.status(400).send('Add Failed');
        })
})

todoRoutes.route('/delete/:id').delete(function (req, res) {
    Todo.findByIdAndDelete(req.params.id)
        .then(() => res.json('Data Deleted'))
})

todoRoutes.route('/update/:id').post(function (req, res) {
    Todo.findById(req.params.id, function (err, todo) {
        if (!todo)
            res.status(404).send('data not found');
        else
            todo.nama = req.body.nama;
        todo.email = req.body.email;
        todo.password = req.body.password;

        todo.save().then(todo => {
            res.json('Todo Updated');
        })
            .catch(err => {
                res.status(400).send('Update Failed');
            })
    })
})

todoRoutes.route('/register').post(function (req, res) {
    const userData = {
        nama: req.body.nama,
        email: req.body.email,
        password: req.body.password
    }

    Todo.findOne({
        email: req.body.email
    })
        .then(user => {
            if (!user) {
                bcrypt.hash(req.body.password, 10, function (err, hash) {
                    userData.password = hash
                    Todo.create(userData)
                        .then(user => {
                            res.json('registered')
                        })
                        .catch(err => {
                            res.send('error:' + err)
                        })
                })
            } else {
                res.json({ error: 'User Exist' })
            }
        })
})

todoRoutes.route('/login').post(function (req, res) {
    Todo.findOne({
        email: req.body.email
    })
        .then(user => {
            if (user) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    const payload = {
                        _id: user._id,
                        nama: user.nama,
                        email: user.email,
                        password: user.password
                    }
                    console.log(payload)
                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 22240
                    })
                    res.send(token)
                }
            } else {
                res.json({
                    error: "User doesn't exist"
                })
            }
        })
})

todoRoutes.route('/profile').get(function (req, res) {
    var decode = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)
    Todo.findOne({
        _id: decode._id
    })
        .then(user => {
            if (user) {
                res.json(user)
            } else {
                res.send("User doesn't exist")
            }
        })
})

app.use('/todos', todoRoutes);

app.listen(PORT, function () {
    console.log("Server Running : " + PORT);
});