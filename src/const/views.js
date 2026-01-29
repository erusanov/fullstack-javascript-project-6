const Views = Object.freeze({
  INDEX: 'index.pug',
  USERS: Object.freeze({
    INDEX: 'users/index.pug',
    NEW: 'users/new.pug',
    EDIT: 'users/edit.pug',
  }),
  SESSIONS: Object.freeze({
    NEW: 'sessions/new.pug',
  }),
  TASK_STATUSES: Object.freeze({
    INDEX: 'taskStatuses/index.pug',
    NEW: 'taskStatuses/new.pug',
    EDIT: 'taskStatuses/edit.pug',
  }),
  LABELS: Object.freeze({
    INDEX: 'labels/index.pug',
    NEW: 'labels/new.pug',
    EDIT: 'labels/edit.pug',
  }),
  TASKS: Object.freeze({
    INDEX: 'tasks/index.pug',
    NEW: 'tasks/new.pug',
    VIEW: 'tasks/show.pug',
    EDIT: 'tasks/edit.pug',
  }),
});

export default Views;
