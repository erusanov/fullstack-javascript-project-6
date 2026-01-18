import { Model } from 'objection'
import bcrypt from 'bcrypt'

class User extends Model {
  static get tableName() {
    return 'users'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],

      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1, maxLength: 255 },
        lastName: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 3 },
        passwordDigest: { type: 'string' },
      },
    }
  }

  $beforeInsert() {
    this.passwordDigest = bcrypt.hashSync(this.password, 10)
    delete this.password
  }

  $beforeUpdate() {
    if (this.password) {
      this.passwordDigest = bcrypt.hashSync(this.password, 10)
      delete this.password
    }
  }

  verifyPassword(password) {
    return bcrypt.compareSync(password, this.passwordDigest)
  }
}

export default User
