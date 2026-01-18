import { ValidationError } from 'objection'
import { checkAuth, checkOwner } from '../lib/middlewares.js'

export default async (app) => {
  app.get('', { name: 'users' }, async (request, reply) => {
    const users = await app.objection.models.user.query()

    return reply.view('users/index.pug', { users })
  })

  app.get('/new', { name: 'usersNew' }, async (request, reply) => {
    const user = {}

    return reply.view('users/new.pug', { user })
  })

  app.post('', { name: 'usersCreate' }, async (request, reply) => {
    const user = request.body.data || {}

    try {
      await app.objection.models.user.query().insert(user)
      request.flash('success', reply.t('flash.users.create.success'))
      reply.redirect(app.reverse('root'))
    }
    catch (e) {
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.users.create.error'))

        return reply.view('users/new.pug', { user, errors: e.data })
      }

      throw e
    }
  })

  app.get('/:id/edit', { name: 'usersEdit', preHandler: [checkAuth(app), checkOwner(app)] }, async (request, reply) => {
    const user = await app.objection.models.user.query().findById(request.params.id)

    return reply.view('users/edit.pug', { user })
  })

  app.patch('/:id', { name: 'usersUpdate', preHandler: [checkAuth(app), checkOwner(app)] }, async (request, reply) => {
    const user = await app.objection.models.user.query().findById(request.params.id)
    const { _method, ...updatedData } = request.body.data

    try {
      if (updatedData.password === '') {
        delete updatedData.password
      }
      await user.$query().patch(updatedData)
      request.flash('success', reply.t('flash.users.edit.success'))
      reply.redirect(app.reverse('users'))
    }
    catch (e) {
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.users.edit.error'))

        return reply.view('users/edit.pug', { user: { ...user, ...updatedData }, errors: e.data })
      }

      throw e
    }
  })

  app.delete('/:id', { name: 'usersDelete', preHandler: [checkAuth(app), checkOwner(app)] }, async (request, reply) => {
    try {
      const userId = request.params.id
      const tasksAsCreator = await app.objection.models.task.query().where('creatorId', userId).first()
      const tasksAsExecutor = await app.objection.models.task.query().where('executorId', userId).first()

      if (tasksAsCreator || tasksAsExecutor) {
        request.flash('error', reply.t('flash.user.delete.hasTasks'))

        return reply.redirect(app.reverse('users'))
      }

      await app.objection.models.user
        .query()
        .deleteById(userId)

      request.flash('success', reply.t('flash.users.delete.success'))
      reply.redirect(app.reverse('users'))
    }
    catch (e) {
      request.flash('error', reply.t('flash.users.delete.error'))
      reply.redirect(app.reverse('users'))
    }
  })
}
