import { test, expect } from '@jest/globals'
import {
  app, request, faker, createAuthenticatedAgent,
} from './setup.js'

test('User can sign in and sign out', async () => {
  const { agent } = await createAuthenticatedAgent()
  const signInResponse = await agent.get(app.reverse('root'))

  expect(signInResponse.statusCode).toEqual(200)
  expect(signInResponse.text).toContain('Вы залогинены')

  const signOutResponse = await agent
    .delete(app.reverse('sessionDelete'))
    .type('form')
    .send({ _method: 'delete' })

  expect(signOutResponse.statusCode).toEqual(302)
  expect(signOutResponse.headers.location).toEqual(app.reverse('root'))

  const rootAfterSignOut = await agent.get(app.reverse('root'))

  expect(rootAfterSignOut.statusCode).toEqual(200)
  expect(rootAfterSignOut.text).toContain('Вы разлогинены')
  expect(rootAfterSignOut.text).toContain('alert-info')
})

test('User cannot sign in with incorrect credentials', async () => {
  const agent = request.agent(app.server)
  const nonExistentEmail = faker.internet.email()
  const incorrectPassword = faker.internet.password()
  const response = await agent
    .post(app.reverse('session'))
    .type('form')
    .send({ data: { email: nonExistentEmail, password: incorrectPassword } })

  expect(response.statusCode).toEqual(200)
  expect(response.text).toContain('Неверный email или пароль')
  expect(response.text).toContain('is-invalid')
})
