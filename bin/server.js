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

// Load config
const actions = []
const triggers = []

const userConfig = require('../config.json')
for (const index in userConfig.actions) {
  actions.push(searchForPlugin(userConfig.actions[index]))
}
for (const index in userConfig.triggers) {
  triggers.push(searchForPlugin(userConfig.triggers[index]))
}
console.log('[actions]')
actions.map(i => console.log('-', i.name, '(', i.slug, ')'))
console.log('[triggers]')
triggers.map(i => console.log('-', i.name, '(', i.slug, ')'))

// Initialize server
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/ifttt/v1/actions/:slug', async function(request, response) {
  const serviceKey = request.headers['ifttt-service-key']
  if (!serviceKey || serviceKey !== process.env.IFTTT_SERVICE_KEY) {
    return response.json({ success: false, error: 'invalid service key given' })
  }

  const slug = request.params.slug

  for (const action of actions) {
    if (slug === action.slug) {
      try {
        const res = await action.action(request.body)
        return response.json({ success: true, response: res })
      } catch (err) {
        return response.json({ success: false, response: err.message })
      }
    }
  }

  response.json({ success: false, error: 'no associated slug' })
})

app.post('/ifttt/v1/triggers/:slug', async function(request, response) {
  const serviceKey = request.headers['ifttt-service-key']
  if (!serviceKey || serviceKey !== process.env.IFTTT_SERVICE_KEY) {
    return response.json({ success: false, error: 'invalid service key given' })
  }

  const slug = request.params.slug

  for (const trigger of triggers) {
    if (slug === trigger.slug) {
      try {
        const res = await trigger.trigger(request.body)
        return response.json({
          data: [
            Object.assign({}, res, {
              meta: {
                id: uuid(),
                timestamp: Date.now(),
              },
            }),
          ],
        })
      } catch (err) {
        return response.json({ data: [] })
      }
    }
  }

  response.json({ success: false, error: 'no associated slug' })
})

app.listen(serverPort, async () => {
  console.log('Listening:', serverPort)
})
