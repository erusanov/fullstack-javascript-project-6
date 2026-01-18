import { ValidationError } from 'objection'
import { checkAuth } from '../lib/middlewares.js'

export default async (app) => {
  app.get('', { name: 'taskStatuses', preHandler: checkAuth(app) }, async (request, reply) => {
    const taskStatuses = await app.objection.models.taskStatus.query()

    return reply.view('taskStatuses/index', { taskStatuses })
  })

  app.get('/new', { name: 'taskStatusesNew', preHandler: checkAuth(app) }, async (request, reply) => {
    const taskStatus = {}

    return reply.view('taskStatuses/new', { taskStatus })
  })

  app.post('', { name: 'taskStatusesCreate', preHandler: checkAuth(app) }, async (request, reply) => {
    const taskStatus = request.body.data

    try {
      await app.objection.models.taskStatus.query().insert(taskStatus)
      request.flash('info', reply.t('flash.taskStatus.create.success'))

      return reply.redirect(app.reverse('taskStatuses'))
    }
    catch (e) {
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.taskStatus.create.error'))

        return reply.view('taskStatuses/new', { taskStatus, errors: e.data })
      }

      throw e
    }
  })

  app.get('/:id/edit', { name: 'taskStatusesEdit', preHandler: checkAuth(app) }, async (request, reply) => {
    const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id)

    return reply.view('taskStatuses/edit', { taskStatus })
  })

  app.patch('/:id', { name: 'taskStatusesUpdate', preHandler: checkAuth(app) }, async (request, reply) => {
    const taskStatus = await app.objection.models.taskStatus.query().findById(request.params.id)
    const { _method, ...updatedData } = request.body.data

    try {
      await taskStatus.$query().patch(updatedData)
      request.flash('info', reply.t('flash.taskStatus.edit.success'))

      return reply.redirect(app.reverse('taskStatuses'))
    }
    catch (e) {
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.taskStatus.edit.error'))

        return reply.view('taskStatuses/edit', { taskStatus: { ...taskStatus, ...updatedData }, errors: e.data })
      }

      throw e
    }
  })

  app.delete('/:id', { name: 'taskStatusesDelete', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const statusId = request.params.id
      const associatedTasks = await app.objection.models.task.query().where('statusId', statusId).first()

      if (associatedTasks) {
        request.flash('error', reply.t('flash.taskStatus.delete.hasTasks'))

        return reply.redirect(app.reverse('taskStatuses'))
      }

      await app.objection.models.taskStatus.query().deleteById(statusId)
      request.flash('success', reply.t('flash.taskStatus.delete.success'))

      return reply.redirect(app.reverse('taskStatuses'))
    }
    catch (e) {
      request.flash('error', reply.t('flash.taskStatus.delete.error'))

      return reply.redirect(app.reverse('taskStatuses'))
    }
  })
}
