const checkAuth = app => async (request, reply) => {
  if (!request.session.get('userId')) {
    request.flash('error', reply.t('flash.authError'))

    return reply.redirect(app.reverse('root'))
  }

  return true
}const checkOwner = app => async (request, reply) => {
  if (!request.session.get('userId')) {
    request.flash('error', reply.t('flash.authError'))

    return reply.redirect(app.reverse('root'))
  }
  if (Number(request.params.id) !== request.session.get('userId')) {
    request.flash('error', reply.t('flash.users.edit.accessDenied'))

    return reply.redirect(app.reverse('users'))
  }

  return true
}

export { checkAuth, checkOwner }
