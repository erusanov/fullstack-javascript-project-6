import dotenv from 'dotenv'
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
import fastifySecureSession from '@fastify/secure-session'
// import fastifySession from '@fastify/session'
import fastifyPassport from '@fastify/passport'
import Rollbar from 'rollbar'
import qs from 'qs'

import knexConfig from './src/db/knexfile.js'
import User from './src/models/User.js'
import TaskStatus from './src/models/TaskStatus.js'
import Task from './src/models/Task.js'
import Label from './src/models/Label.js'
import usersRoutes from './src/routes/users.js'
import sessionsRoutes from './src/routes/sessions.js'
import taskStatusesRoutes from './src/routes/taskStatuses.js'
import tasksRoutes from './src/routes/tasks.js'
import labelsRoutes from './src/routes/labels.js'
import en from './src/locales/en.json' with { type: 'json' }
import ru from './src/locales/ru.json' with { type: 'json' }
import { Routes } from './src/const/routes.js'
import { FormStrategy } from './src/lib/auth.js'

dotenv.config({ path: `./.env.${process.env.NODE_ENV}` })

const ROUTES = Routes
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

  app.register(fastifySecureSession, {
    secret: process.env.SESSION_SECRET,
    cookie: {
      path: '/',
    },
  })

  app.register(fastifyMethodOverride, { getBody: '_method' })
  app.register(fastifyFormbody, { parser: qs.parse })

  app.decorateReply('t', function (key, i18nextOptions) {
    return i18next.t(key, i18nextOptions)
  })

  fastifyPassport.registerUserDeserializer(
    user => app.objection.models.user
      .query()
      .findById(user.id),
  )

  fastifyPassport.registerUserSerializer(async user => user)
  fastifyPassport.use(new FormStrategy('form', app))

  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())
  await app.decorate('fp', fastifyPassport)

  app.decorate('authenticate', (...args) => fastifyPassport.authenticate(
    'form',
    {
      failureRedirect: app.reverse(ROUTES.ROOT.NAME),
      failureFlash: i18next.t('flash.auth.errors.authError'),
    },
  )(...args))

  await app.register(fastifyObjectionjs, {
    knexConfig: options.knexConfig,
    models: [User, TaskStatus, Task, Label],
  })

  app.addHook('preHandler', async (request, reply) => {
    request.currentUser = request.user
    request.isSignedIn = request.isAuthenticated()

    reply.locals = {
      isAuthenticated: request.isAuthenticated(),
      t: i18next.t,
      flash: reply.flash() || {},
      app,
      ROUTES,
    }
  })

  app.register(fastifyView, {
    engine: { pug },
    root: path.join(__dirname, 'src', 'views'),
    defaultContext: { t: i18next.t, app, ROUTES },
    propertyName: 'view',
  })

  app.get(ROUTES.ROOT.URL, { name: ROUTES.ROOT.NAME }, (request, reply) => {
    return reply.view('index.pug')
  })

  app.register(usersRoutes)
  app.register(sessionsRoutes)
  app.register(taskStatusesRoutes)
  app.register(tasksRoutes)
  app.register(labelsRoutes)

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
