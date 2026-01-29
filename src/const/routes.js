const Routes = Object.freeze({
  ROOT: Object.freeze({
    URL: '/',
    NAME: 'root',
  }),

  USERS: Object.freeze({
    URL: '/users',
    NAME: 'users',
  }),
  USERS_NEW: Object.freeze({
    URL: '/users/new',
    NAME: 'usersNew',
  }),
  USERS_CREATE: Object.freeze({
    URL: '/users',
    NAME: 'usersCreate',
  }),
  USERS_EDIT: Object.freeze({
    URL: '/users/:id/edit',
    NAME: 'usersEdit',
  }),
  USERS_UPDATE: Object.freeze({
    URL: '/users/:id',
    NAME: 'usersUpdate',
  }),
  USERS_DELETE: Object.freeze({
    URL: '/users/:id',
    NAME: 'usersDelete',
  }),

  SESSIONS: Object.freeze({
    URL: '/session',
    NAME: 'sessions',
  }),
  SESSIONS_NEW: Object.freeze({
    URL: '/session/new',
    NAME: 'sessionNew',
  }),
  SESSIONS_CREATE: Object.freeze({
    URL: '/session',
    NAME: 'session',
  }),
  SESSIONS_DELETE: Object.freeze({
    URL: '/session',
    NAME: 'sessionDelete',
  }),

  TASK_STATUSES: Object.freeze({
    URL: '/statuses',
    NAME: 'taskStatuses',
  }),
  TASK_STATUSES_NEW: Object.freeze({
    URL: '/statuses/new',
    NAME: 'taskStatusesNew',
  }),
  TASK_STATUSES_CREATE: Object.freeze({
    URL: '/statuses',
    NAME: 'taskStatusesCreate',
  }),
  TASK_STATUSES_EDIT: Object.freeze({
    URL: '/statuses/:id/edit',
    NAME: 'taskStatusesEdit',
  }),
  TASK_STATUSES_UPDATE: Object.freeze({
    URL: '/statuses/:id',
    NAME: 'taskStatusesUpdate',
  }),
  TASK_STATUSES_DELETE: Object.freeze({
    URL: '/statuses/:id',
    NAME: 'taskStatusesDelete',
  }),

  LABELS: Object.freeze({
    URL: '/labels',
    NAME: 'labels',
  }),
  LABELS_NEW: Object.freeze({
    URL: '/labels/new',
    NAME: 'labelsNew',
  }),
  LABELS_CREATE: Object.freeze({
    URL: '/labels',
    NAME: 'labelsCreate',
  }),
  LABELS_EDIT: Object.freeze({
    URL: '/labels/:id/edit',
    NAME: 'labelsEdit',
  }),
  LABELS_UPDATE: Object.freeze({
    URL: '/labels/:id',
    NAME: 'labelsUpdate',
  }),
  LABELS_DELETE: Object.freeze({
    URL: '/labels/:id',
    NAME: 'labelsDelete',
  }),

  TASKS: Object.freeze({
    URL: '/tasks',
    NAME: 'tasks',
  }),
  TASKS_NEW: Object.freeze({
    URL: '/tasks/new',
    NAME: 'tasksNew',
  }),
  TASKS_CREATE: Object.freeze({
    URL: '/tasks',
    NAME: 'tasksCreate',
  }),
  TASKS_VIEW: Object.freeze({
    URL: '/tasks/:id',
    NAME: 'taskView',
  }),
  TASKS_EDIT: Object.freeze({
    URL: '/tasks/:id/edit',
    NAME: 'tasksEdit',
  }),
  TASKS_UPDATE: Object.freeze({
    URL: '/tasks/:id',
    NAME: 'tasksUpdate',
  }),
  TASKS_DELETE: Object.freeze({
    URL: '/tasks/:id',
    NAME: 'tasksDelete',
  }),
});

export default Routes;
