import { test, expect } from '@jest/globals';
import {
  app, request, faker, createAuthenticatedAgent, createTaskStatus,
} from './setup.js';
import Routes from '../src/const/routes.js';

test('GET /tasks', async () => {
  const { agent } = await createAuthenticatedAgent();
  const res = await agent.get(app.reverse(Routes.TASKS.NAME));

  expect(res.statusCode).toEqual(200);
});

test('GET /tasks (unauthenticated)', async () => {
  const res = await request(app.server).get(app.reverse(Routes.TASKS.NAME));

  expect(res.statusCode).toEqual(302);
  expect(res.headers.location).toEqual(app.reverse(Routes.ROOT.NAME));
});

test('GET /tasks/new', async () => {
  const { agent } = await createAuthenticatedAgent();
  const res = await agent.get(app.reverse(Routes.TASKS_NEW.NAME));

  expect(res.statusCode).toEqual(200);
});

test('POST /tasks', async () => {
  const { agent, user } = await createAuthenticatedAgent();
  const status = await createTaskStatus();
  const taskData = {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    statusId: status.id,
    executorId: user.id,
  };

  await agent
    .post(app.reverse(Routes.TASKS_CREATE.NAME))
    .type('form')
    .send({ data: taskData });

  const task = await app.objection.models.task.query().findOne({ name: taskData.name });

  expect(task).toBeDefined();
});

test('POST /tasks without executor and labels', async () => {
  const { agent } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const taskData = {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    statusId: status.id,
  };

  await agent
    .post(app.reverse(Routes.TASKS_CREATE.NAME))
    .type('form')
    .send({ data: taskData });

  const task = await app.objection.models.task
    .query()
    .findOne({ name: taskData.name });

  expect(task).toBeDefined();
  expect(task.executorId).toBeNull();

  const taskWithLabels = await app.objection.models.task
    .query()
    .findById(task.id)
    .withGraphFetched('labels');

  expect(taskWithLabels.labels).toHaveLength(0);
});

test('POST /tasks without status should fail', async () => {
  const { agent } = await createAuthenticatedAgent();
  const taskName = faker.lorem.sentence();
  const taskDescription = faker.lorem.paragraph();

  const taskData = {
    name: taskName,
    description: taskDescription,
    executorId: null,
  };

  const res = await agent
    .post(app.reverse(Routes.TASKS_CREATE.NAME))
    .type('form')
    .send({ data: taskData });

  expect(res.statusCode).toEqual(422);

  const task = await app.objection.models.task
    .query()
    .findOne({ name: taskData.name });

  expect(task).toBeUndefined();
  expect(res.text).toContain(taskName);
  expect(res.text).toContain(taskDescription);
  expect(res.text).toContain(app.t('flash.task.errors.create.validation'));
});

test('GET /tasks/:id/edit', async () => {
  const { agent, user } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const task = await app.objection.models.task
    .query()
    .insert({
      name: faker.lorem.sentence(),
      statusId: status.id,
      creatorId: user.id,
    });
  const res = await agent.get(app.reverse(Routes.TASKS_EDIT.NAME, { id: task.id }));

  expect(res.statusCode).toEqual(200);
});

test('GET /tasks/:id/edit (unauthenticated)', async () => {
  const { user } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const task = await app.objection.models.task
    .query()
    .insert({
      name: faker.lorem.sentence(),
      statusId: status.id,
      creatorId: user.id,
    });

  const res = await request(app.server)
    .get(app.reverse(Routes.TASKS_EDIT.NAME, { id: task.id }));

  expect(res.statusCode).toEqual(302);
  expect(res.headers.location).toEqual(app.reverse(Routes.ROOT.NAME));
});

test('PATCH /tasks/:id', async () => {
  const { agent, user } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const task = await app.objection.models.task
    .query()
    .insert({
      name: faker.lorem.sentence(),
      statusId: status.id,
      creatorId: user.id,
    });

  const taskId = task.id;

  const updatedData = {
    name: faker.lorem.sentence(),
  };

  await agent
    .patch(app.reverse(Routes.TASKS_UPDATE.NAME, { id: taskId }))
    .type('form')
    .send({ data: updatedData });

  const updatedTask = await app.objection.models.task
    .query()
    .findById(taskId);

  expect(updatedTask.name).toEqual(updatedData.name);
});

test('PATCH /tasks/:id (unauthenticated)', async () => {
  const { user } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const task = await app.objection.models.task
    .query()
    .insert({
      name: faker.lorem.sentence(),
      statusId: status.id,
      creatorId: user.id,
    });

  const updatedData = { name: faker.lorem.sentence() };

  const res = await request(app.server)
    .patch(app.reverse(Routes.TASKS_UPDATE.NAME, { id: task.id }))
    .type('form')
    .send({ data: updatedData });

  expect(res.statusCode).toEqual(302);
  expect(res.headers.location).toEqual(app.reverse(Routes.ROOT.NAME));

  const taskAfterUpdateAttempt = await app.objection.models.task
    .query()
    .findById(task.id);

  expect(taskAfterUpdateAttempt.name).toEqual(task.name);
});

test('DELETE /tasks/:id (as creator)', async () => {
  const { agent, user } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const task = await app.objection.models.task
    .query()
    .insert({
      name: faker.lorem.sentence(),
      statusId: status.id,
      creatorId: user.id,
    });

  await agent.delete(app.reverse(Routes.TASKS_DELETE.NAME, { id: task.id }));

  const deletedTask = await app.objection.models.task
    .query()
    .findById(task.id);

  expect(deletedTask).toBeUndefined();
});

test('DELETE /tasks/:id (not as creator)', async () => {
  const { user: creator } = await createAuthenticatedAgent();
  const { agent: otherAgent } = await createAuthenticatedAgent();
  const status = await createTaskStatus();

  const task = await app.objection.models.task
    .query()
    .insert({
      name: faker.lorem.sentence(),
      statusId: status.id,
      creatorId: creator.id,
    });

  await otherAgent.delete(app.reverse(Routes.TASKS_DELETE.NAME, { id: task.id }));

  const existingTask = await app.objection.models.task
    .query()
    .findById(task.id);

  expect(existingTask).toBeDefined();
});
