import { ValidationError } from 'objection'
import { Routes  } from '../const/routes.js'
import { Views } from '../const/views.js'
import { FlashStatus } from '../const/flashStatus.js'

const { LABELS: LabelViews } = Views

export default async (app) => {
  app.get(
    Routes.LABELS.URL,
    {
      name: Routes.LABELS.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => reply
      .view(
        LabelViews.INDEX,
        {
          labels: await app.objection.models.label.query(),
        },
      ),
  )

  app.get(
    Routes.LABELS_NEW.URL,
    {
      name: Routes.LABELS_NEW.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => reply
      .view(
        LabelViews.NEW,
        {
          label: {},
        },
      ),
  )

  app.post(
    Routes.LABELS_CREATE.URL,
    {
      name: Routes.LABELS_CREATE.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const label = request.body.data

      try {
        await app.objection.models.label.query().insert(label)
      }
      catch (e) {
        if (e instanceof ValidationError) {
          request.flash(FlashStatus.ERROR, reply.t('flash.label.create.error'))

          return reply.view(LabelViews.NEW, { label, errors: e.data })
        }

        throw new Error(reply.t('errors.label.create'))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.label.create.success'))
      reply.redirect(app.reverse(Routes.LABELS.NAME))
    },
  )

  app.get(
    Routes.LABELS_EDIT.URL,
    {
      name: Routes.LABELS_EDIT.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const label = await app.objection.models.label.query().findById(request.params.id)

      return reply.view(LabelViews.EDIT, { label })
    },
  )

  app.patch(
    Routes.LABELS_UPDATE.URL,
    {
      name: Routes.LABELS_UPDATE.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const label = await app.objection.models.label
        .query()
        .findById(request.params.id)

      const { _method, ...updatedData } = request.body.data

      try {
        await label.$query().patch(updatedData)
      }
      catch (e) {
        if (e instanceof ValidationError) {
          request.flash(FlashStatus.ERROR, reply.t('flash.label.edit.error'))

          return reply.view(
            LabelViews.EDIT,
            {
              label: {
                ...label,
                ...updatedData,
              },
              errors: e.data,
            },
          )
        }

        throw new Error(reply.t('errors.label.update'))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.label.edit.success'))
      reply.redirect(app.reverse(Routes.LABELS.NAME))
    },
  )

  app.delete(
    Routes.LABELS_DELETE.URL,
    {
      name: Routes.LABELS_DELETE.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const label = await app.objection.models.label
        .query()
        .findById(request.params.id)
        .withGraphFetched('tasks')

      if (label.tasks.length > 0) {
        request.flash(FlashStatus.ERROR, reply.t('flash.label.delete.hasTasks'))

        return reply.redirect(app.reverse(Routes.LABELS.NAME))
      }

      try {
        await app.objection.models.label
          .query()
          .deleteById(request.params.id)
      }
      catch (e) {
        throw new Error(reply.t('errors.label.delete'))
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.label.delete.success'))
      reply.redirect(app.reverse(Routes.LABELS.NAME))
    },
  )
}
