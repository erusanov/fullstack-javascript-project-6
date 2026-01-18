import { test, expect } from '@jest/globals'
import Task from '../models/Task.js'
import {
  app, request, faker, createAuthenticatedAgent, createTaskStatus,
} from './setup.js'

test('GET /statuses', async () => {
  const { agent } = await createAuthenticatedAgent()
  const res = await agent.get(app.reverse('taskStatuses'))

  expect(res.statusCode).toEqual(200)
})

test('GET /statuses (unauthenticated)', async () => {
  const res = await request(app.server).get(app.reverse('taskStatuses'))

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse('root'))
})

test('POST /statuses', async () => {
  const { agent } = await createAuthenticatedAgent()
  const statusData = {
    name: faker.word.noun(),
  }

  await agent
    .post(app.reverse('taskStatusesCreate'))
    .type('form')
    .send({ data: statusData })

  const status = await app.objection.models.taskStatus.query().findOne({ name: statusData.name })

  expect(status).toBeDefined()
})

test('GET /statuses/:id/edit (unauthenticated)', async () => {
  const taskStatus = await createTaskStatus()
  const res = await request(app.server).get(app.reverse('taskStatusesEdit', { id: taskStatus.id }))

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse('root'))
})

test('PATCH /statuses/:id (unauthenticated)', async () => {
  const taskStatus = await createTaskStatus()
  const updatedData = { name: faker.word.noun() }
  const res = await request(app.server)
    .patch(app.reverse('taskStatusesUpdate', { id: taskStatus.id }))
    .type('form')
    .send({ data: updatedData })

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse('root'))

  const statusAfterUpdateAttempt = await app.objection.models.taskStatus.query().findById(taskStatus.id)

  expect(statusAfterUpdateAttempt.name).toEqual(taskStatus.name)
})

test('DELETE /statuses/:id (unauthenticated)', async () => {
  const taskStatus = await createTaskStatus()
  const res = await request(app.server).delete(app.reverse('taskStatusesDelete', { id: taskStatus.id }))

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse('root'))

  const statusAfterDeleteAttempt = await app.objection.models.taskStatus.query().findById(taskStatus.id)

  expect(statusAfterDeleteAttempt).toBeDefined()
})

test('DELETE /statuses/:id (with associated tasks)', async () => {
  const { agent, user } = await createAuthenticatedAgent()
  const taskStatus = await createTaskStatus()

  await Task.query().insert({
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    statusId: taskStatus.id,
    creatorId: user.id,
    executorId: null,
  })

  const res = await agent.delete(app.reverse('taskStatusesDelete', { id: taskStatus.id }))

  expect(res.statusCode).toEqual(302)

  const statusAfterDeleteAttempt = await app.objection.models.taskStatus.query().findById(taskStatus.id)

  expect(statusAfterDeleteAttempt).toBeDefined()
})
