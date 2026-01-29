import { ValidationError } from 'objection';
import checkOwner from '../lib/middlewares.js';
import Routes from '../const/routes.js';
import Views from '../const/views.js';
import FlashStatus from '../const/flashStatus.js';
import { applyFlashError, normalizeValidationErrors } from '../lib/validation.js';

const { TASKS: TaskViews } = Views;

export default async (app) => {
  app.get(
    Routes.TASKS.URL,
    {
      name: Routes.TASKS.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { query } = request;

      let tasksQuery = app.objection.models.task
        .query()
        .withGraphJoined('[status, creator, executor, labels]');

      if (query.statusId) {
        tasksQuery = tasksQuery.where('statusId', query.statusId);
      }

      if (query.executorId) {
        tasksQuery = tasksQuery.where('executorId', query.executorId);
      }

      if (query.labelId) {
        tasksQuery = tasksQuery.whereExists(
          app.objection.models.label
            .query()
            .alias('label_filter')
            .join('task_label', 'task_label.label_id', 'label_filter.id')
            .whereRaw('task_label.task_id = tasks.id')
            .where('label_filter.id', query.labelId),
        );
      }

      if (query.isCreatorUser) {
        tasksQuery = tasksQuery.where('creatorId', request.user.id);
      }

      const [tasks, users, statuses, labels] = await Promise.all([
        tasksQuery,
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);

      return reply.view(TaskViews.INDEX, {
        tasks,
        users,
        statuses,
        labels,
        filter: query,
      });
    },
  );

  app.get(
    Routes.TASKS_NEW.URL,
    {
      name: Routes.TASKS_NEW.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const [users, statuses, labels] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);

      return reply.view(TaskViews.NEW, {
        task: {},
        users,
        statuses,
        labels,
      });
    },
  );

  app.post(
    Routes.TASKS_CREATE.URL,
    {
      name: Routes.TASKS_CREATE.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { labels: labelIds, ...taskData } = request.body.data;
      const normalizedLabelIds = []
        .concat(labelIds || [])
        .filter(Boolean)
        .map(Number)
        .filter(Number.isFinite);

      const processedTaskData = {
        ...taskData,
        statusId: Number(taskData.statusId) || null,
        executorId: Number(taskData.executorId) || null,
        creatorId: request.user.id,
      };

      let insertedTask;
      try {
        insertedTask = await app.objection.models.task
          .query()
          .insert(processedTaskData);
      } catch (e) {
        const [users, statuses, labels] = await Promise.all([
          app.objection.models.user.query(),
          app.objection.models.taskStatus.query(),
          app.objection.models.label.query(),
        ]);

        if (e instanceof ValidationError) {
          applyFlashError(request, reply, 'flash.task.errors.create.validation');

          return reply
            .code(422)
            .view(
              TaskViews.NEW,
              {
                task: request.body.data,
                users,
                statuses,
                labels,
                errors: normalizeValidationErrors(e.data),
              },
            );
        }

        applyFlashError(request, reply, 'flash.task.errors.create.db');

        return reply
          .view(
            TaskViews.NEW,
            {
              task: request.body.data,
              users,
              statuses,
              labels,
            },
          );
      }

      if (normalizedLabelIds.length > 0) {
        try {
          await Promise.all(
            normalizedLabelIds.map((labelId) => insertedTask
              .$relatedQuery('labels')
              .relate(labelId)),
          );
        } catch (e) {
          request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.addLabels'));

          return reply.redirect(app.reverse(Routes.TASKS_NEW.NAME));
        }
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.task.create.success'));
      return reply.redirect(app.reverse(Routes.TASKS.NAME));
    },
  );

  app.get(
    Routes.TASKS_VIEW.URL,
    {
      name: Routes.TASKS_VIEW.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const task = await app.objection.models.task
        .query()
        .findById(request.params.id)
        .withGraphJoined('[status, creator, executor, labels]');

      return reply.view(TaskViews.VIEW, { task });
    },
  );

  app.get(
    Routes.TASKS_EDIT.URL,
    {
      name: Routes.TASKS_EDIT.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const [task, users, statuses, labels] = await Promise.all([
        app.objection.models.task.query().findById(request.params.id).withGraphJoined('labels'),
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);

      return reply.view(TaskViews.EDIT, {
        task,
        users,
        statuses,
        labels,
      });
    },
  );

  app.patch(
    Routes.TASKS_UPDATE.URL,
    {
      name: Routes.TASKS_UPDATE.NAME,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { _method, labels: labelIds, ...taskData } = request.body.data;
      const normalizedLabelIds = []
        .concat(labelIds || [])
        .filter(Boolean)
        .map(Number)
        .filter(Number.isFinite);

      let task;
      try {
        task = await app.objection.models.task
          .query()
          .findById(request.params.id);
      } catch (e) {
        request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.load'));

        return reply.redirect(app.reverse(Routes.TASKS.NAME));
      }

      const processedTaskData = {
        ...taskData,
        statusId: Number(taskData.statusId) || task.statusId,
        executorId: Number(taskData.executorId) || null,
      };

      delete processedTaskData.creatorId;

      try {
        await task.$query().patch(processedTaskData);
      } catch (e) {
        if (e instanceof ValidationError) {
          applyFlashError(request, reply, 'flash.task.errors.edit.validation');

          const [users, statuses, labels] = await Promise.all([
            app.objection.models.user.query(),
            app.objection.models.taskStatus.query(),
            app.objection.models.label.query(),
          ]);

          return reply
            .code(422)
            .view(
              TaskViews.EDIT,
              {
                task: { ...request.body.data },
                users,
                statuses,
                labels,
                errors: normalizeValidationErrors(e.data),
              },
            );
        }

        request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.edit.db'));

        return reply.redirect(app.reverse(Routes.TASKS_EDIT.NAME, { id: request.params.id }));
      }

      if (normalizedLabelIds.length > 0) {
        try {
          await task.$relatedQuery('labels').unrelate();
        } catch (e) {
          request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.updateLabels'));

          return reply.redirect(app.reverse(Routes.TASKS_EDIT.NAME, { id: request.params.id }));
        }

        try {
          await Promise.all(
            normalizedLabelIds
              .map((labelId) => task.$relatedQuery('labels').relate(labelId)),
          );
        } catch (e) {
          request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.updateLabels'));

          return reply.redirect(app.reverse(Routes.TASKS_EDIT.NAME, { id: request.params.id }));
        }
      } else {
        try {
          await task.$relatedQuery('labels').unrelate();
        } catch (e) {
          request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.updateLabels'));

          return reply.redirect(app.reverse(Routes.TASKS_EDIT.NAME, { id: request.params.id }));
        }
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.task.edit.success'));
      return reply.redirect(app.reverse(Routes.TASKS.NAME));
    },
  );

  app.delete(
    Routes.TASKS_DELETE.URL,
    {
      name: Routes.TASKS_DELETE.NAME,
      preHandler: [app.authenticate, checkOwner(app, { model: 'task' })],
    },
    async (request, reply) => {
      try {
        await app.objection.models.task.query().deleteById(request.params.id);
      } catch (e) {
        request.flash(FlashStatus.ERROR, reply.t('flash.task.errors.delete.db'));

        return reply.redirect(app.reverse(Routes.TASKS.NAME));
      }

      request.flash(FlashStatus.SUCCESS, reply.t('flash.task.delete.success'));
      return reply.redirect(app.reverse(Routes.TASKS.NAME));
    },
  );
};
