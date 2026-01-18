import { test, expect } from '@jest/globals'
import Task from '../models/Task.js'
import {
  app, request, faker, createAuthenticatedAgent, createTaskStatus,
} from './setup.js'

test('GET /users', async () => {
  const res = await request(app.server).get(app.reverse('users'))

  expect(res.statusCode).toEqual(200)
})

test('GET /users/new', async () => {
  const res = await request(app.server).get(app.reverse('usersNew'))

  expect(res.statusCode).toEqual(200)
})

test('POST /users', async () => {
  const userData = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  }

  await request(app.server)
    .post(app.reverse('usersCreate'))
    .type('form')
    .send({ data: userData })

  const user = await app.objection.models.user.query().findOne({ email: userData.email })

  expect(user).toBeDefined()
  expect(user.firstName).toEqual(userData.firstName)
})

test('User can edit their own profile', async () => {
  const { agent, user } = await createAuthenticatedAgent()
  const resEditPage = await agent.get(app.reverse('usersEdit', { id: user.id }))

  expect(resEditPage.statusCode).toEqual(200)

  const updatedData = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
  }

  await agent
    .patch(app.reverse('usersUpdate', { id: user.id }))
    .type('form')
    .send({ data: updatedData })

  const updatedUser = await app.objection.models.user.query().findById(user.id)

  expect(updatedUser.firstName).toEqual(updatedData.firstName)
})

test('User can delete their own profile', async () => {
  const { agent, user } = await createAuthenticatedAgent()

  await agent.delete(app.reverse('usersDelete', { id: user.id }))

  const deletedUser = await app.objection.models.user.query().findById(user.id)

  expect(deletedUser).toBeUndefined()
})

test('User cannot edit or delete other users', async () => {
  const { user: user1 } = await createAuthenticatedAgent()
  const { agent: agent2 } = await createAuthenticatedAgent()
  const resEdit = await agent2.get(app.reverse('usersEdit', { id: user1.id }))

  expect(resEdit.statusCode).toEqual(302)

  const resDelete = await agent2.delete(app.reverse('usersDelete', { id: user1.id }))

  expect(resDelete.statusCode).toEqual(302)

  const user1After = await app.objection.models.user.query().findById(user1.id)

  expect(user1After).toBeDefined()
})

test('User can edit their own profile without changing password', async () => {
  const { agent, user } = await createAuthenticatedAgent()
  const oldPassword = user.passwordDigest
  const resEditPage = await agent.get(app.reverse('usersEdit', { id: user.id }))

  expect(resEditPage.statusCode).toEqual(200)

  const updatedData = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: '',
  }

  await agent
    .patch(app.reverse('usersUpdate', { id: user.id }))
    .type('form')
    .send({ data: updatedData })

  const updatedUser = await app.objection.models.user.query().findById(user.id)

  expect(updatedUser.firstName).toEqual(updatedData.firstName)
  expect(updatedUser.passwordDigest).toEqual(oldPassword)
})

test('User cannot be deleted if associated with a task', async () => {
  const { agent, user } = await createAuthenticatedAgent()
  const taskStatus = await createTaskStatus()

  await Task.query().insert({
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    statusId: taskStatus.id,
    creatorId: user.id,
    executorId: null,
  })

  const res = await agent.delete(app.reverse('usersDelete', { id: user.id }))

  expect(res.statusCode).toEqual(302)

  const userAfterDeleteAttempt = await app.objection.models.user.query().findById(user.id)

  expect(userAfterDeleteAttempt).toBeDefined()
})
