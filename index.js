import path from 'path'
import knex from 'knex'
import { fileURLToPath } from 'url'
import Fastify from 'fastify'
import fastifyView from '@fastify/view'
import pug from 'pug'
import i18next from 'i18next'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import fastifyMethodOverride from 'fastify-method-override'
import fastifyObjectionjs from 'fastify-objectionjs'
import fastifyCookie from '@fastify/cookie'
import fastifyFlash from '@fastify/flash'
import fastifySession from '@fastify/session'
import Rollbar from 'rollbar'
import qs from 'qs'

import knexConfig from './db/knexfile.js'
import User from './models/User.js'
import TaskStatus from './models/TaskStatus.js'
import Task from './models/Task.js'
import Label from './models/Label.js'
import usersRoutes from './routes/users.js'
import sessionsRoutes from './routes/sessions.js'
import taskStatusesRoutes from './routes/taskStatuses.js'
import tasksRoutes from './routes/tasks.js'
import labelsRoutes from './routes/labels.js'

import en from './locales/en.json' with { type: 'json' }
import ru from './locales/ru.json' with { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const buildApp = async (options = {}) => {
  const app = Fastify({
    logger: options.logger ?? true,
    ...options.fastify,
  })

  if (process.env.NODE_ENV !== 'test') {
    const knexInstance = knex(options.knexConfig)

    try {
      await knexInstance.migrate.latest()
    }
    catch (error) {
      console.error('Error running migrations:', error)
      process.exit(1)
    }
  }

  const routes = new Map()

  app.decorate('reverse', (name, params) => {
    let url = routes.get(name)

    if (params) {
      for (const key in params) {
        url = url.replace(`:${key}`, params[key])
      }
    }

    return url
  })

  app.addHook('onRoute', (routeOptions) => {
    if (routeOptions.name) {
      routes.set(routeOptions.name, routeOptions.url)
    }
  })

  const rollbar = process.env.NODE_ENV === 'test'
    ? null
    : new Rollbar({
        accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
        environment: process.env.NODE_ENV,
        captureUncaught: true,
        captureUnhandledRejections: true,
      })

  await i18next.init({
    lng: 'ru',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV !== 'production',
    resources: { en, ru },
  })

  app.decorate('t', i18next.t)

  app.register(fastifyStatic, {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
  })
  app.register(fastifyCookie)
  app.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'a-very-long-and-super-secret-key-for-session-with-at-least-32-characters',
    cookie: { secure: false },
  })
  app.register(fastifyFlash)
  app.register(fastifyMethodOverride, { getBody: '_method' })
  app.register(fastifyFormbody, { parser: qs.parse })

  app.decorateReply('t', function (key, i18nextOptions) {
    return i18next.t(key, i18nextOptions)
  })

  app.decorateRequest('currentUser', null)
  app.decorateRequest('isSignedIn', false)

  await app.register(fastifyObjectionjs, {
    knexConfig: options.knexConfig,
    models: [User, TaskStatus, Task, Label],
  })

  app.addHook('preHandler', async (request, reply) => {
    const userId = request.session.get('userId')

    reply.locals = {
      isAuthenticated: !!userId,
      t: i18next.t,
      flash: reply.flash() || {},
      app,
    }
    if (userId) {
      request.currentUser = await app.objection.models.user.query().findById(userId)
      request.isSignedIn = true
    }
  })

  app.register(fastifyView, {
    engine: { pug },
    root: path.join(__dirname, 'views'),
    defaultContext: { t: i18next.t, app },
    propertyName: 'view',
  })

  app.get('/', { name: 'root' }, (request, reply) => {
    return reply.view('index.pug')
  })

  app.register(usersRoutes, { prefix: '/users' })
  app.register(sessionsRoutes, { prefix: '/session' })
  app.register(taskStatusesRoutes, { prefix: '/statuses' })
  app.register(tasksRoutes, { prefix: '/tasks' })
  app.register(labelsRoutes, { prefix: '/labels' })

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error)
    if (rollbar) {
      rollbar.error(error, request)
    }
    reply.status(500).send({ error: 'Something went wrong!' })
  })

  return app
}

export const start = async () => {
  try {
    const app = await buildApp({ knexConfig: knexConfig[process.env.NODE_ENV || 'development'] })

    await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
  }
  catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'test') {
  start()
}
