import FlashStatus from '../const/flashStatus.js';

const normalizeValidationErrors = (errorsData) => Object
  .entries(errorsData || {})
  .reduce((acc, [field, fieldErrors]) => {
    const firstError = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;

    // eslint-disable-next-line no-param-reassign
    acc[field] = { message: firstError?.message || firstError };

    return acc;
  }, {});

const applyFlashError = (request, reply, message) => {
  request.flash(FlashStatus.ERROR, reply.t(message));

  reply.locals = reply.locals || {};
  reply.locals.flash = reply.locals.flash || {};
  reply.locals.flash[FlashStatus.ERROR] = [reply.t(message)];
};

export {
  normalizeValidationErrors,
  applyFlashError,
};
