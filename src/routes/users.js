import { ValidationError } from 'objection'
import { checkOwner } from '../lib/middlewares.js'
import { Routes } from '../const/routes.js'
import { Views } from '../const/views.js'
import { FlashStatus } from '../const/flashStatus.js'

const { USERS: UserViews } = Views

export default async (app) => {
  app.get(
    Routes.USERS.URL,
    {
      name: Routes.USERS.NAME,
    },
    async (request, reply) => reply
      .view(
        UserViews.INDEX,
        {
          users: await app.objection.models.user.query(),
        },
      ),
  )

  app.get(
    Routes.USERS_NEW.URL,
    {
      name: Routes.USERS_NEW.NAME,
    },
    async (request, reply) => reply
      .view(
        UserViews.NEW,
        {
          user: {},
        },
      ),
  )

  app.post(
    Routes.USERS_CREATE.URL,
    {
      name: Routes.USERS_CREATE.NAME,
    },
    async (request, reply) => {
      const user = request.body.data || {}

      try {
        await app.objection.models.user
          .query()
          .insert(user)
      }
      catch (e) {
        if (e instanceof ValidationError) {
          request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.create.validation'))

          return reply.view(UserViews.NEW, { user, errors: e.data })
        }

        request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.create.db'))

        return reply.redirect(app.reverse(Routes.USERS_NEW.NAME))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.users.create.success'))
      reply.redirect(app.reverse(Routes.ROOT.NAME))
    })

  app.get(
    Routes.USERS_EDIT.URL,
    {
      name: Routes.USERS_EDIT.NAME,
      preHandler: [app.authenticate, checkOwner(app)],
    },
    async (request, reply) => reply
      .view(
        UserViews.EDIT,
        {
          user: await app.objection.models.user
            .query()
            .findById(request.params.id),
        },
      ),
  )

  app.patch(
    Routes.USERS_UPDATE.URL,
    {
      name: Routes.USERS_UPDATE.NAME,
      preHandler: [app.authenticate, checkOwner(app)],
    },
    async (request, reply) => {
      const { _method, ...updatedData } = request.body.data

      const user = await app.objection.models.user
        .query()
        .findById(request.params.id)

      try {
        if (updatedData.password === '') {
          delete updatedData.password
        }

        await user
          .$query()
          .patch(updatedData)
      }
      catch (e) {
        if (e instanceof ValidationError) {
          request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.edit.validation'))

          return reply.view(UserViews.EDIT, { user: { ...user, ...updatedData }, errors: e.data })
        }

        request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.edit.db'))

        return reply.redirect(app.reverse(Routes.USERS_EDIT.NAME, { id: request.params.id }))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.users.edit.success'))
      reply.redirect(app.reverse(Routes.USERS.NAME))
    },
  )

  app.delete(
    Routes.USERS_DELETE.URL,
    {
      name: Routes.USERS_DELETE.NAME,
      preHandler: [app.authenticate, checkOwner(app)],
    },
    async (request, reply) => {
      const { task, user } = app.objection.models
      const userId = request.params.id

      let tasksAsCreator
      let tasksAsExecutor
      try {
        [tasksAsCreator, tasksAsExecutor] = await Promise.all([
          task.query().where('creatorId', userId).first(),
          task.query().where('executorId', userId).first(),
        ])
      }
      catch (e) {
        request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.checkTasks'))

        return reply.redirect(app.reverse(Routes.USERS.NAME))
      }

      if (tasksAsCreator || tasksAsExecutor) {
        request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.delete.hasTasks'))

        return reply.redirect(app.reverse(Routes.USERS.NAME))
      }

      try {
        await user
          .query()
          .deleteById(userId)
      }
      catch (e) {
        request.flash(FlashStatus.ERROR, reply.t('flash.users.errors.delete.db'))

        return reply.redirect(app.reverse(Routes.USERS.NAME))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.users.delete.success'))
      reply.redirect(app.reverse(Routes.USERS.NAME))
    },
  )
}
