import { ValidationError } from 'objection'
import { checkAuth } from '../lib/middlewares.js'

export default async (app) => {
  app.get('', { name: 'labels', preHandler: checkAuth(app) }, async (request, reply) => {
    const labels = await app.objection.models.label.query()

    return reply.view('labels/index', { labels })
  })

  app.get('/new', { name: 'labelsNew', preHandler: checkAuth(app) }, async (request, reply) => {
    const label = {}

    return reply.view('labels/new', { label })
  })

  app.post('', { name: 'labelsCreate', preHandler: checkAuth(app) }, async (request, reply) => {
    const label = request.body.data

    try {
      await app.objection.models.label.query().insert(label)
      request.flash('info', reply.t('flash.label.create.success'))

      return reply.redirect(app.reverse('labels'))
    }
    catch (e) {
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.label.create.error'))

        return reply.view('labels/new', { label, errors: e.data })
      }

      throw e
    }
  })

  app.get('/:id/edit', { name: 'labelsEdit', preHandler: checkAuth(app) }, async (request, reply) => {
    const label = await app.objection.models.label.query().findById(request.params.id)

    return reply.view('labels/edit', { label })
  })

  app.patch('/:id', { name: 'labelsUpdate', preHandler: checkAuth(app) }, async (request, reply) => {
    const label = await app.objection.models.label.query().findById(request.params.id)    const { _method, ...updatedData } = request.body.data

    try {
      await label.$query().patch(updatedData)

      request.flash('info', reply.t('flash.label.edit.success'))

      return reply.redirect(app.reverse('labels'))
    }
    catch (e) {
      if (e instanceof ValidationError) {
        request.flash('error', reply.t('flash.label.edit.error'))

        return reply.view('labels/edit', { label: { ...label, ...updatedData }, errors: e.data })
      }

      throw e
    }
  })

  app.delete('/:id', { name: 'labelsDelete', preHandler: checkAuth(app) }, async (request, reply) => {
    try {
      const label = await app.objection.models.label.query().findById(request.params.id).withGraphFetched('tasks')

      if (label.tasks.length > 0) {
        request.flash('error', reply.t('flash.label.delete.error'))

        return reply.redirect(app.reverse('labels'))
      }

      await app.objection.models.label.query().deleteById(request.params.id)

      request.flash('success', reply.t('flash.label.delete.success'))

      return reply.redirect(app.reverse('labels'))
    }
    catch (e) {
      request.flash('error', reply.t('flash.label.delete.error'))

      return reply.redirect(app.reverse('labels'))
    }
  })
}
