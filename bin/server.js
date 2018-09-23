const express = require('express')
const bodyParser = require('body-parser')
const glob = require('glob')
const uuid = require('uuid/v1')
const path = require('path')

const serverPort = process.env.IFTTT_SERVICE_PORT || 8091 // incoming port

function searchForPlugin(name) {
  let plugin = ''
  try {
    return require(name)
  } catch (err) {
    return require(path.join('../services', name))
  }
}

function findAction(slug) {
  return actions.find(action => action.slug === slug)
}

function loadConfig() {
  const userConfig = require('../config.json')

  let actions = []
  for (const index in userConfig.actions) {
    actions.push(searchForPlugin(userConfig.actions[index]))
  }

  let triggers = []
  for (const index in userConfig.triggers) {
    triggers.push(searchForPlugin(userConfig.triggers[index]))
  }

  console.debug('[actions]')
  actions.map(i => console.debug('-', i.name, '(', i.slug, ')'))
  console.debug('[triggers]')
  triggers.map(i => console.debug('-', i.name, '(', i.slug, ')'))

  return [actions, triggers]
}

function checkService(req, res, next) {
  const serviceKey = req.headers['ifttt-service-key']
  if (!serviceKey || serviceKey !== process.env.IFTTT_SERVICE_KEY) {
    res.json({ success: false, error: 'invalid service key given' })
  } else {
    next()
  }
}

// Load config
const [actions, triggers] = loadConfig()

// Initialize server
const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/ifttt/v1/actions/:slug', checkService, async function(
  request,
  response
) {
  const action = findAction(request.params.slug)
  if (!action) {
    return response.json({ success: false, error: 'no associated slug' })
  }

  try {
    const res = await action.action(request.body)
    return response.json({ success: true, response: res })
  } catch (err) {
    return response.json({ success: false, response: err.message })
  }
})

app.post('/ifttt/v1/triggers/:slug', checkService, async function(
  request,
  response
) {
  const { slug } = request.params
  const trigger = triggers.find(trigger => trigger.slug === slug)
  if (!trigger) {
    return response.json({ success: false, error: 'no associated slug' })
  }

  let data = []
  try {
    const res = await trigger.trigger(request.body)
    data = [
      Object.assign({}, res, {
        meta: {
          id: uuid(),
          timestamp: Date.now(),
        },
      }),
    ]
  } catch (err) {}

  return response.json({ success: true, data })
})

app.listen(serverPort, async () => {
  console.log('Listening:', serverPort)
})
