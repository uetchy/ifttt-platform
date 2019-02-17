import express from 'express'
import bodyParser from 'body-parser'
import uuid from 'uuid/v1'
import findPackageJson from 'find-package-json'
import glob from 'glob'
import path from 'path'

export interface Param {
  name: string
  description?: string
}

export interface Metadata {
  name: string
  params: Param[]
}

export interface Invoker {
  slug: string
  meta?: Metadata
}

export interface InvokerFunction {
  (triggerFields: object): any
}

export interface Action extends Invoker {
  action: InvokerFunction
}

export interface Trigger extends Invoker {
  trigger: InvokerFunction
}

export interface Plugin {
  invoker: Action | Trigger
  description?: string
}

const serverPort = process.env.IFTTT_SERVICE_PORT || 8091 // incoming port

function searchForPlugin(name: string): Plugin | undefined {
  let plugin = ''
  try {
    const invoker = require(name)
    const pkg = findPackageJson(name).next().value
    return {
      invoker,
      description: pkg!.description,
    }
  } catch (err) {
    return undefined
  }
}

function findPlugin(slug: string) {
  return actions.find((action) => action.invoker.slug === slug)
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
  actions.map((i) => console.debug('-', i.invoker.slug))

  console.debug('[triggers]')
  triggers.map((i) => console.debug('-', i.invoker.slug))

  return [actions, triggers]
}

function verifyServiceKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
app.post(
  '/ifttt/v1/actions/:slug',
  verifyServiceKey,
  async (request, response) => {
    const plugin = findPlugin(request.params.slug)
    if (!plugin) {
      return response.json({
        success: false,
        error: 'no associated action found',
      })
    }

    try {
      const res = await (<Action>plugin.invoker).action(request.body)
      return response.json({ success: true, response: res })
    } catch (err) {
      return response.json({ success: false, response: err.message })
    }
  }
)

// triggers endpoint
app.post(
  '/ifttt/v1/triggers/:slug',
  verifyServiceKey,
  async (request, response) => {
    const { slug } = request.params
    const plugin = triggers.find((trigger) => trigger.invoker.slug === slug)
    if (!plugin) {
      return response.json({
        success: false,
        error: 'no associated trigger found',
      })
    }

    let data = []
    try {
      const res = await (<Trigger>plugin.invoker).trigger(request.body)
      data = [
        Object.assign({}, res, {
          meta: {
            id: uuid(),
            timestamp: Date.now(),
          },
        }),
      ]
    } catch (err) {}

    return response.json({ success: true, data: data })
  }
)

// handle errors
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(500)
    res.json({ err: err.message })
  }
)

export default app
