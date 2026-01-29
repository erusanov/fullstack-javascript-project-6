import Routes from '../const/routes.js';
import Views from '../const/views.js';
import FlashStatus from '../const/flashStatus.js';

const { SESSIONS: SessionViews } = Views;

export default async function sessions(app) {
  const validateSignIn = async (request, reply) => {
    // eslint-disable-next-line no-underscore-dangle
    if (request.body?._method === 'delete') {
      return true;
    }

    const data = request.body?.data ?? {};
    const email = data.email ?? '';
    const password = data.password ?? '';

    if (!email || !password) {
      reply.locals = {
        isAuthenticated: request.isAuthenticated?.() ?? false,
        t: app.t,
        flash: reply.flash?.() || {},
        app,
        ROUTES: Routes,
      };

      return reply
        .status(422)
        .view(
          SessionViews.NEW,
          {
            signInForm: { email },
            errors: { email: app.t('flash.session.errors.create') },
          },
        );
    }

    return true;
  };

  app.get(
    Routes.SESSIONS_NEW.URL,
    {
      name: Routes.SESSIONS_NEW.NAME,
    },
    async (request, reply) => {
      const flash = reply.locals?.flash || {};
      const [errorMessage] = flash.error || [];
      const errors = errorMessage ? { email: errorMessage } : null;

      return reply.view(
        SessionViews.NEW,
        {
          signInForm: {},
          errors,
        },
      );
    },
  );

  app.post(
    Routes.SESSIONS_CREATE.URL,
    {
      name: Routes.SESSIONS_CREATE.NAME,
      preValidation: [
        validateSignIn,
        app.fp.authenticate('form', {
          failureRedirect: app.reverse(Routes.SESSIONS_NEW.NAME),
          failureFlash: app.t('flash.session.errors.create'),
        }),
      ],
    },
    async (request, reply) => {
      request.flash(FlashStatus.SUCCESS, reply.t('flash.session.create.success'));

      return reply.redirect(app.reverse(Routes.ROOT.NAME));
    },
  );

  app.delete(
    Routes.SESSIONS_DELETE.URL,
    {
      name: Routes.SESSIONS_DELETE.NAME,
    },
    async (request, reply) => {
      request.logOut();
      request.flash(FlashStatus.INFO, reply.t('flash.session.delete.success'));

      return reply.redirect(app.reverse(Routes.ROOT.NAME));
    },
  );
}
