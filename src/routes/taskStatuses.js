import { ValidationError } from 'objection'
import { Routes } from '../const/routes.js'
import { Views } from '../const/views.js'
import { FlashStatus } from '../const/flashStatus.js'

const { TASK_STATUSES: TaskStatusViews } = Views

export default async (app) => {
  app.get(
    Routes.TASK_STATUSES.URL,
    {
      name: Routes.TASK_STATUSES.NAME,
      preHandler: app.authenticate,
    },
    async (request, reply) => reply
      .view(
        TaskStatusViews.INDEX,
        {
          taskStatuses: await app.objection.models.taskStatus.query(),
        },
      ),
  )

  app.get(
    Routes.TASK_STATUSES_NEW.URL,
    {
      name: Routes.TASK_STATUSES_NEW.NAME,
      preHandler: app.authenticate,
    },
    async (request, reply) => reply
      .view(
        TaskStatusViews.NEW,
        {
          taskStatus: {},
        },
      ),
  )

  app.post(
    Routes.TASK_STATUSES_CREATE.URL,
    {
      name: Routes.TASK_STATUSES_CREATE.NAME,
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      const taskStatus = request.body.data

      try {
        await app.objection.models.taskStatus
          .query()
          .insert(taskStatus)
      }
      catch (e) {
        if (e instanceof ValidationError) {
          request.flash(FlashStatus.ERROR, reply.t('flash.taskStatus.create.error'))

          return reply.view(TaskStatusViews.NEW, { taskStatus, errors: e.data })
        }

        throw new Error(reply.t('errors.taskStatus.create'))
      }

      request.flash(FlashStatus.INFO, reply.t('flash.taskStatus.create.success'))
      reply.redirect(app.reverse(Routes.TASK_STATUSES.NAME))
    },
  )

  app.get(
    Routes.TASK_STATUSES_EDIT.URL,
    {
      name: Routes.TASK_STATUSES_EDIT.NAME,
      preHandler: app.authenticate,
    },
    async (request, reply) => reply
      .view(
        TaskStatusViews.EDIT,
        {
          taskStatus: await app.objection.models.taskStatus
            .query()
            .findById(request.params.id),
        },
      ),
  )

  app.patch(
    Routes.TASK_STATUSES_UPDATE.URL,
    {
      name: Routes.TASK_STATUSES_UPDATE.NAME,
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      const taskStatus = await app.objection.models.taskStatus
        .query()
        .findById(request.params.id)

      const { _method, ...updatedData } = request.body.data

      try {
        await taskStatus
          .$query()
          .patch(updatedData)
      }
      catch (e) {
        if (e instanceof ValidationError) {
          request.flash(FlashStatus.ERROR, reply.t('flash.taskStatus.edit.error'))

          return reply.view(
            TaskStatusViews.EDIT,
            {
              taskStatus: { ...taskStatus, ...updatedData },
              errors: e.data,
            },
          )
        }

        throw new Error(reply.t('errors.taskStatus.update'))
      }

      request.flash(FlashStatus.INFO, reply.t('flash.taskStatus.edit.success'))
      reply.redirect(app.reverse(Routes.TASK_STATUSES.NAME))
    },
  )

  app.delete(
    Routes.TASK_STATUSES_DELETE.URL,
    {
      name: Routes.TASK_STATUSES_DELETE.NAME,
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      const statusId = request.params.id

      let associatedTasks
      try {
        associatedTasks = await app.objection.models.task
          .query()
          .where('statusId', statusId)
          .first()
      }
      catch (e) {
        throw new Error(reply.t('errors.taskStatus.checkTasks'))
      }

      if (associatedTasks) {
        request.flash(FlashStatus.ERROR, reply.t('flash.taskStatus.hasTasks'))

        return reply.redirect(app.reverse(Routes.TASK_STATUSES.NAME))
      }

      try {
        await app.objection.models.taskStatus
          .query()
          .deleteById(statusId)
      }
      catch (e) {
        throw new Error(reply.t('errors.taskStatus.delete'))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.taskStatus.delete.success'))
      reply.redirect(app.reverse(Routes.TASK_STATUSES.NAME))
    },
  )
}
