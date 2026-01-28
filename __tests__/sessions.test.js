import { test, expect } from '@jest/globals'
import {
  app, request, faker,
} from './setup.js'
import User from '../src/models/User.js'
import { Routes as ROUTES } from '../src/const/routes.js'

test('User can sign in and sign out', async () => {
  const agent = request.agent(app.server)
  const rawPassword = faker.internet.password()
  const userData = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: rawPassword,
  }

  await User.query().insert(userData)

  const signInResponse = await agent
    .post(app.reverse(ROUTES.SESSIONS_CREATE.NAME))
    .type('form')
    .send({ data: { email: userData.email, password: rawPassword } })

  expect(signInResponse.statusCode).toEqual(302)
  expect(signInResponse.headers.location).toEqual(app.reverse(ROUTES.ROOT.NAME))

  const rootAfterSignIn = await agent.get(app.reverse(ROUTES.ROOT.NAME))
  expect(rootAfterSignIn.statusCode).toEqual(200)
  expect(rootAfterSignIn.text).toContain('Вы залогинены')

  const signOutResponse = await agent
    .delete(app.reverse(ROUTES.SESSIONS_DELETE.NAME))
    .type('form')
    .send({ _method: 'delete' })

  expect(signOutResponse.statusCode).toEqual(302)
  expect(signOutResponse.headers.location).toEqual(app.reverse(ROUTES.ROOT.NAME))

  const rootAfterSignOut = await agent.get(app.reverse(ROUTES.ROOT.NAME))

  expect(rootAfterSignOut.statusCode).toEqual(200)
  expect(rootAfterSignOut.text).toContain('Вы разлогинены')
  expect(rootAfterSignOut.text).toContain('alert-info')
})

test('User cannot sign in with incorrect credentials', async () => {
  const agent = request.agent(app.server)
  const nonExistentEmail = faker.internet.email()
  const incorrectPassword = faker.internet.password()
  const response = await agent
    .post(app.reverse(ROUTES.SESSIONS_CREATE.NAME))
    .type('form')
    .send({ data: { email: nonExistentEmail, password: incorrectPassword } })

  expect(response.statusCode).toEqual(302)
  expect(response.headers.location).toEqual(app.reverse(ROUTES.SESSIONS_NEW.NAME))

  const sessionNewResponse = await agent.get(app.reverse(ROUTES.SESSIONS_NEW.NAME))

  expect(sessionNewResponse.statusCode).toEqual(200)
  expect(sessionNewResponse.text).toContain('Неверный email или пароль')
})
