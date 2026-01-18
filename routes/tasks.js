import { ValidationError } from 'objection'
import { checkAuth } from '../lib/middlewares.js'

export default async (app) => {
  app.get('', { name: 'tasks', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const { query } = request

      let tasksQuery = app.objection.models.task.query().withGraphJoined('[status, creator, executor, labels]')

      if (query.statusId) {
        tasksQuery = tasksQuery.where('statusId', query.statusId)
      }
      if (query.executorId) {
        tasksQuery = tasksQuery.where('executorId', query.executorId)
      }
      if (query.labelId) {
        tasksQuery = tasksQuery.whereExists(
          app.objection.models.label.query().alias('label_filter').whereRaw('label_filter.id = task_label.labelId').where('label_filter.id', query.labelId),
        )
      }
      if (query.isCreatorUser) {
        tasksQuery = tasksQuery.where('creatorId', request.currentUser.id)
      }

      const tasks = await tasksQuery

      const users = await app.objection.models.user.query()
      const statuses = await app.objection.models.taskStatus.query()
      const labels = await app.objection.models.label.query()

      return reply.view('tasks/index', {
        tasks,
        users,
        statuses,
        labels,
        filter: query,
      })
    }
    catch (e) {
      app.log.error('--- ERROR in GET /tasks handler ---', e)

      throw e
    }
  })

  app.get('/new', { name: 'tasksNew', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const task = {}
      const users = await app.objection.models.user.query()
      const statuses = await app.objection.models.taskStatus.query()
      const labels = await app.objection.models.label.query()

      return reply.view('tasks/new', { task, users, statuses, labels })
    }
    catch (e) {
      app.log.error('--- ERROR in GET /tasks/new handler ---', e)

      throw e
    }
  })

  app.post('', { name: 'tasksCreate', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const { labels: labelIds, ...taskData } = request.body.data

      const processedTaskData = { ...taskData }

      processedTaskData.statusId = processedTaskData.statusId === '' ? 0 : Number(processedTaskData.statusId)

      if (processedTaskData.executorId === '') {
        processedTaskData.executorId = null
      }
      else if (processedTaskData.executorId) {
        processedTaskData.executorId = Number(processedTaskData.executorId)
      }

      const taskToInsert = {
        ...processedTaskData,
        creatorId: request.currentUser.id,
      }
      const insertedTask = await app.objection.models.task.query().insert(taskToInsert)

      if (labelIds) {
        await insertedTask.$relatedQuery('labels').relate(labelIds)
      }
      request.flash('info', reply.t('flash.task.create.success'))

      return reply.redirect(app.reverse('tasks'))
    }
    catch (e) {
      app.log.error('--- ERROR in POST /tasks handler ---', e)
      if (e instanceof ValidationError) {
        request.log.error(`[tasksCreate] Validation error: ${e.message}`)
        request.log.error(`[tasksCreate] Validation data: ${JSON.stringify(e.data)}`)
        reply.locals.flash.error = reply.locals.flash.error || []
        reply.locals.flash.error.push(reply.t('flash.task.create.error'))

        const users = await app.objection.models.user.query()
        const statuses = await app.objection.models.taskStatus.query()
        const labels = await app.objection.models.label.query()

        return reply.code(422).view('tasks/new', { task: request.body.data, users, statuses, labels, errors: e.data })
      }

      throw e
    }
  })

  app.get('/:id', { name: 'taskView' }, async (request, reply) => {
    try {
      const task = await app.objection.models.task.query()
        .findById(request.params.id)
        .withGraphJoined('[status, creator, executor, labels]')

      return reply.view('tasks/view', { task })
    }
    catch (e) {
      app.log.error(`--- ERROR in GET /tasks/${request.params.id} handler ---`, e)

      throw e
    }
  })

  app.get('/:id/edit', { name: 'tasksEdit', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const task = await app.objection.models.task.query().findById(request.params.id).withGraphJoined('labels')
      const users = await app.objection.models.user.query()
      const statuses = await app.objection.models.taskStatus.query()
      const labels = await app.objection.models.label.query()

      return reply.view('tasks/edit', { task, users, statuses, labels })
    }
    catch (e) {
      app.log.error(`--- ERROR in GET /tasks/${request.params.id}/edit handler ---`, e)

      throw e
    }
  })

  app.patch('/:id', { name: 'tasksUpdate', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const task = await app.objection.models.task.query().findById(request.params.id)
      const { _method, labels: labelIds, ...taskData } = request.body.data
      const processedTaskData = { ...taskData }

      if (Object.prototype.hasOwnProperty.call(taskData, 'statusId')) {
        if (taskData.statusId === '') {
          delete processedTaskData.statusId
        }
        else {
          const numStatusId = Number(taskData.statusId)

          if (!Number.isNaN(numStatusId)) {
            processedTaskData.statusId = numStatusId
          }
          else {
            delete processedTaskData.statusId
          }
        }
      }
      else {
        delete processedTaskData.statusId
      }

      if (Object.prototype.hasOwnProperty.call(taskData, 'executorId')) {
        if (taskData.executorId === '') {
          processedTaskData.executorId = null
        }
        else {
          const numExecutorId = Number(taskData.executorId)

          if (!Number.isNaN(numExecutorId)) {
            processedTaskData.executorId = numExecutorId
          }
          else {
            delete processedTaskData.executorId
          }
        }
      }
      else {
        delete processedTaskData.executorId
      }

      delete processedTaskData.creatorId

      await task.$query().patch(processedTaskData)

      if (labelIds) {
        await task.$relatedQuery('labels').unrelate()
        await task.$relatedQuery('labels').relate(labelIds)
      }
      else {
        await task.$relatedQuery('labels').unrelate()
      }
      request.flash('success', reply.t('flash.task.edit.success'))

      return reply.redirect(app.reverse('tasks'))
    }
    catch (e) {
      app.log.error(`--- ERROR in PATCH /tasks/${request.params.id} handler ---`, e)
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.task.edit.error'))

        const users = await app.objection.models.user.query()
        const statuses = await app.objection.models.taskStatus.query()
        const labels = await app.objection.models.label.query()

        return reply.code(422).view('tasks/edit', { task: { ...request.body.data }, users, statuses, labels, errors: e.data })
      }

      throw e
    }
  })

  app.delete('/:id', { name: 'tasksDelete', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const task = await app.objection.models.task.query().findById(request.params.id)

      if (task.creatorId !== request.currentUser.id) {
        request.flash('error', reply.t('flash.task.delete.accessDenied'))
        app.log.warn(`[tasksDelete] Access denied for user ${request.currentUser.id} to delete task ${task.id}`)

        return reply.redirect(app.reverse('tasks'))
      }

      await app.objection.models.task.query().deleteById(request.params.id)
      request.flash('success', reply.t('flash.task.delete.success'))

      return reply.redirect(app.reverse('tasks'))
    }
    catch (e) {
      app.log.error(`--- ERROR in DELETE /tasks/${request.params.id} handler ---`, e)
      request.flash('error', reply.t('flash.task.delete.error'))

      return reply.redirect(app.reverse('tasks'))
    }
  })
}
