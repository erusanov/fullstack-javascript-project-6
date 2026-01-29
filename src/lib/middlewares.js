import Routes from '../const/routes.js';

const checkOwner = (app, { model } = {}) => async (request, reply) => {
  if (model === 'task') {
    const task = await app.objection.models.task
      .query()
      .findById(request.params.id);

    if (task.creatorId !== request.user.id) {
      request.flash('error', reply.t('flash.task.errors.delete.accessDenied'));

      return reply.redirect(app.reverse(Routes.TASKS.NAME));
    }
  } else if (Number(request.params.id) !== request.user.id) {
    request.flash('error', reply.t('flash.users.errors.edit.accessDenied'));

    return reply.redirect(app.reverse(Routes.USERS.NAME));
  }
  return true;
};

export default checkOwner;
