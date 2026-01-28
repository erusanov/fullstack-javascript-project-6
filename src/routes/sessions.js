import { Routes } from '../const/routes.js'
import { Views } from '../const/views.js'
import { FlashStatus } from '../const/flashStatus.js'

const { SESSIONS: SessionViews } = Views

export default async (app) => {
  app.get(
    Routes.SESSIONS_NEW.URL,
    {
      name: Routes.SESSIONS_NEW.NAME,
    },
    async (request, reply) => reply
      .view(
        SessionViews.NEW,
        {
          signInForm: {},
        },
      ),
  )

  app.post(
    Routes.SESSIONS_CREATE.URL,
    {
      name: Routes.SESSIONS_CREATE.NAME,
      preValidation: app.fp.authenticate('form', {
        failureRedirect: app.reverse(Routes.SESSIONS_NEW.NAME),
        failureFlash: app.t('flash.session.errors.create'),
      }),
    },
    async (request, reply) => {
      request.flash(FlashStatus.SUCCESS, reply.t('flash.session.create.success'))

      return reply.redirect(app.reverse(Routes.ROOT.NAME))
    },
  )

  app.delete(
    Routes.SESSIONS_DELETE.URL,
    {
      name: Routes.SESSIONS_DELETE.NAME,
    },
    async (request, reply) => {
      request.logOut()
      request.flash(FlashStatus.INFO, reply.t('flash.session.delete.success'))

      return reply.redirect(app.reverse(Routes.ROOT.NAME))
    },
  )
}
