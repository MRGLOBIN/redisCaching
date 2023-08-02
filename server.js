const path = require('path')

const express = require('express')
const morgan = require('morgan')
const redis = require('redis')

const app = express()

// setting redis client
const redisClient = redis.createClient()
redisClient.connect()
redisClient.on('error', (err) => console.log('Redis Client Error', err))
redisClient.on('connect', () => console.log('redis Server connected'))

// setting view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', getTasks)

async function getTasks(req, res, next) {
  const title = 'Task List'
  const tasks = await redisClient.lRange('tasks', 0, -1)
  if (tasks.length > 0) {
    res.render('index', {
      title,
      tasks,
    })
  }
}

app.listen(3000, () => {
  console.log('server is listening on http://localhost:3000')
})
