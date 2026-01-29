import {
  beforeAll, afterAll, beforeEach,
} from '@jest/globals';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import { buildApp } from '../index.js';
import knexConfig from '../src/db/knexfile.js';
import User from '../src/models/User.js';
import TaskStatus from '../src/models/TaskStatus.js';
import Routes from '../src/const/routes.js';

// eslint-disable-next-line import/no-mutable-exports
let app; let knex;

beforeAll(async () => {
  app = await buildApp({ knexConfig: knexConfig.test, logger: false });
  await app.ready();
  knex = app.objection.knex;
  await knex.migrate.latest();
});

afterAll(async () => {
  await knex.migrate.rollback();
  await knex.destroy();
  await app.close();
});

beforeEach(async () => {
  await knex('task_label').truncate();
  await knex('tasks').truncate();
  await knex('task_statuses').truncate();
  await knex('labels').truncate();
  await knex('users').truncate();
});

const createAuthenticatedAgent = async () => {
  const rawPassword = faker.internet.password();

  const userData = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: rawPassword,
  };

  const user = await User.query().insert(userData);
  const agent = request.agent(app.server);

  await agent
    .post(app.reverse(Routes.SESSIONS_CREATE.NAME))
    .type('form')
    .send({ data: { email: user.email, password: rawPassword } });

  return { agent, user };
};

const createTaskStatus = async () => {
  const statusData = {
    name: faker.word.noun(),
  };
  const taskStatus = await TaskStatus.query().insert(statusData);

  return taskStatus;
};

export {
  app,
  knex,
  request,
  faker,
  createAuthenticatedAgent,
  createTaskStatus,
};
