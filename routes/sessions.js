export default async (app) => {
  app.get('/new', { name: 'sessionNew' }, async (request, reply) => {
    const signInForm = {}

    return reply.view('sessions/new.pug', { signInForm })
  })

  app.post('', { name: 'session' }, async (request, reply) => {
    const { email, password } = request.body.data || {}
    const errors = {}

    if (!email) {
      errors.email = reply.t('flash.session.create.error')
      request.flash('error', reply.t('flash.session.create.error'))

      return reply.view('sessions/new.pug', { signInForm: request.body.data || {}, errors })
    }

    const user = await app.objection.models.user.query().findOne({ email })

    if (!user || !user.verifyPassword(password)) {
      errors.email = reply.t('flash.session.create.error')
      request.flash('error', reply.t('flash.session.create.error'))

      return reply.view('sessions/new.pug', { signInForm: request.body.data || {}, errors })
    }

    request.session.set('userId', user.id)
    request.flash('success', reply.t('flash.session.create.success'))

    return reply.redirect(app.reverse('root'))
  })

  app.delete('', { name: 'sessionDelete' }, async (request, reply) => {
    request.flash('info', reply.t('flash.session.delete.success'))
    request.session.set('userId', null)

    return reply.redirect(app.reverse('root'))
  })
}
