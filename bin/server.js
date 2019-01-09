const express = require('express')
const bodyParser = require('body-parser')
const glob = require('glob')
const uuid = require('uuid/v1')
const path = require('path')
const findPackageJson = require('find-package-json')

const serverPort = process.env.IFTTT_SERVICE_PORT || 8091 // incoming port

function searchForPlugin(name) {
  let plugin = ''
  try {
    const action = require(name)
    const pkg = findPackageJson(name).next().value
    return {
      action,
      description: pkg.description,
    }
  } catch (err) {
    return undefined
  }
}

function findAction(slug) {
  return actions.find(action => action.action.slug === slug)
}

function loadActionsAndTriggers() {
  const userConfig = require('../config.json')

  let actions = []
  for (const actionName of userConfig.actions) {
    const actionPackageName = actionName.startsWith('ifso-')
      ? actionName
      : `ifso-${actionName}`
    const plugin = searchForPlugin(actionPackageName)
    if (plugin) {
      actions.push(plugin)
    }
  }

  let triggers = []
  for (const triggerName of userConfig.triggers) {
    const triggerPackageName = triggerName.startsWith('ifso-')
      ? triggerName
      : `ifso-${triggerName}`
    const plugin = searchForPlugin(triggerPackageName)
    if (plugin) {
      triggers.push(plugin)
    }
  }

  console.debug('[actions]')
  actions.map(i => console.debug('-', i.action.slug))

  console.debug('[triggers]')
  triggers.map(i => console.debug('-', i.action.slug))

  return [actions, triggers]
}

function verifyServiceKey(req, res, next) {
  const serviceKey = req.headers['ifttt-service-key']
  if (!serviceKey || serviceKey !== process.env.IFTTT_SERVICE_KEY) {
    res.json({ success: false, error: 'invalid service key given' })
  } else {
    next()
  }
}

// Load config
const [actions, triggers] = loadActionsAndTriggers()

// Initialize server
const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// actions endpoint
app.post('/ifttt/v1/actions/:slug', verifyServiceKey, async function(
  request,
  response
) {
  const action = findAction(request.params.slug)
  if (!action) {
    return response.json({
      success: false,
      error: 'no associated action found',
    })
  }

  try {
    const res = await action.action.action(request.body)
    return response.json({ success: true, response: res })
  } catch (err) {
    return response.json({ success: false, response: err.message })
  }
})

// triggers endpoint
app.post('/ifttt/v1/triggers/:slug', verifyServiceKey, async function(
  request,
  response
) {
  const { slug } = request.params
  const trigger = triggers.find(trigger => trigger.slug === slug)
  if (!trigger) {
    return response.json({
      success: false,
      error: 'no associated trigger found',
    })
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

// handle errors
app.use(function(err, req, res, next) {
  res.status(500)
  res.json({ err: err.message })
})

module.exports = app
