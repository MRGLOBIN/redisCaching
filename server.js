const path = require('path')

const express = require('express')
const morgan = require('morgan')
const redis = require('redis')
const { name } = require('ejs')

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

app.post('/task/add', async (req, res) => {
  const task = req.body.task
  try {
    const vv = await redisClient.rPush('tasks', task)
    console.log(vv)
    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.post('/task/delete', async (req, res) => {
  const taskToDel = req.body.tasks
  try {
    const tasks = await redisClient.lRange('tasks', 0, -1)
    for (let i = 0; i < tasks.length; i++) {
      if (taskToDel.indexOf(tasks[i]) > -1) {
        await redisClient.lRem('tasks', 0, tasks[i])
      }
    }
    res.redirect('/')
  } catch (err) {
    console.error(err)
  }
})

app.post('/call/add', async (req, res) => {
  let newCall = {}

  newCall.name = req.body.name
  newCall.company = req.body.company
  newCall.phone = req.body.phone
  newCall.time = req.body.time

  try {
    const {code, err} = redisClient
      .multi()
      .hSet('call', 'name', newCall.name)
      .hSet('call', 'company', newCall.company)
      .hSet('call', 'phone', newCall.phone)
      .hSet('call', 'time', newCall.time)
      .EXEC()
      if(err) {
        console.error(err)
      }
      res.redirect('/')
  } catch (err) {
    console.error(err)
  }
})

async function getTasks(req, res, next) {
  const title = 'Task List'
  try {
    const tasks = await redisClient.lRange('tasks', 0, -1)
    const call = await redisClient.hGetAll('call')
    if (tasks.length > 0) {
      res.render('index', {
        title,
        tasks,
        call,
      })
    }
  } catch (err) {
    console.error(err)
  }
}

app.listen(3000, () => {
  console.log('server is listening on http://localhost:3000')
})
