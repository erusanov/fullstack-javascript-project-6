import { test, expect } from '@jest/globals'
import {
  app, request, faker, createAuthenticatedAgent, createTaskStatus,
} from './setup.js'
import { Routes as ROUTES } from '../src/const/routes.js'

test('GET /labels', async () => {
  const { agent } = await createAuthenticatedAgent()
  const res = await agent.get(app.reverse(ROUTES.LABELS.NAME))

  expect(res.statusCode).toEqual(200)
})

test('GET /labels (unauthenticated)', async () => {
  const res = await request(app.server).get(app.reverse(ROUTES.LABELS.NAME))

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse(ROUTES.ROOT.NAME))
})

test('GET /labels/new', async () => {
  const { agent } = await createAuthenticatedAgent()
  const res = await agent.get(app.reverse(ROUTES.LABELS_NEW.NAME))

  expect(res.statusCode).toEqual(200)
})

test('POST /labels', async () => {
  const { agent } = await createAuthenticatedAgent()
  const labelData = { name: faker.lorem.word() }

  await agent
    .post(app.reverse(ROUTES.LABELS_CREATE.NAME))
    .type('form')
    .send({ data: labelData })

  const label = await app.objection.models.label.query().findOne({ name: labelData.name })

  expect(label).toBeDefined()
})

test('GET /labels/:id/edit', async () => {
  const { agent } = await createAuthenticatedAgent()
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })
  const res = await agent.get(app.reverse(ROUTES.LABELS_EDIT.NAME, { id: label.id }))

  expect(res.statusCode).toEqual(200)
})

test('GET /labels/:id/edit (unauthenticated)', async () => {
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })
  const res = await request(app.server).get(app.reverse(ROUTES.LABELS_EDIT.NAME, { id: label.id }))

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse(ROUTES.ROOT.NAME))
})

test('PATCH /labels/:id', async () => {
  const { agent } = await createAuthenticatedAgent()
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })
  const updatedData = { name: faker.lorem.word() }

  await agent
    .patch(app.reverse(ROUTES.LABELS_UPDATE.NAME, { id: label.id }))
    .type('form')
    .send({ data: updatedData })

  const updatedLabel = await app.objection.models.label.query().findById(label.id)

  expect(updatedLabel.name).toEqual(updatedData.name)
})

test('PATCH /labels/:id (unauthenticated)', async () => {
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })
  const updatedData = { name: faker.lorem.word() }
  const res = await request(app.server)
    .patch(app.reverse(ROUTES.LABELS_UPDATE.NAME, { id: label.id }))
    .type('form')
    .send({ data: updatedData })

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse(ROUTES.ROOT.NAME))

  const labelAfterUpdateAttempt = await app.objection.models.label.query().findById(label.id)

  expect(labelAfterUpdateAttempt.name).toEqual(label.name)
})

test('DELETE /labels/:id', async () => {
  const { agent } = await createAuthenticatedAgent()
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })

  await agent.delete(app.reverse(ROUTES.LABELS_DELETE.NAME, { id: label.id }))

  const deletedLabel = await app.objection.models.label.query().findById(label.id)

  expect(deletedLabel).toBeUndefined()
})

test('DELETE /labels/:id (unauthenticated)', async () => {
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })
  const res = await request(app.server).delete(app.reverse(ROUTES.LABELS_DELETE.NAME, { id: label.id }))

  expect(res.statusCode).toEqual(302)
  expect(res.headers.location).toEqual(app.reverse(ROUTES.ROOT.NAME))

  const labelAfterDeleteAttempt = await app.objection.models.label.query().findById(label.id)

  expect(labelAfterDeleteAttempt).toBeDefined()
})

test('DELETE /labels/:id (with associated tasks)', async () => {
  const { agent, user } = await createAuthenticatedAgent()
  const status = await createTaskStatus()
  const label = await app.objection.models.label.query().insert({ name: faker.lorem.word() })
  const task = await app.objection.models.task.query().insert({
    name: faker.lorem.sentence(),
    statusId: status.id,
    creatorId: user.id,
  })

  await task.$relatedQuery('labels').relate(label.id)

  await agent.delete(app.reverse(ROUTES.LABELS_DELETE.NAME, { id: label.id }))

  const existingLabel = await app.objection.models.label.query().findById(label.id)

  expect(existingLabel).toBeDefined()
})
