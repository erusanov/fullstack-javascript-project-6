import { Model } from 'objection'
import Task from './Task.js'

class Label extends Model {
  static get tableName() {
    return 'labels'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
      },
    }
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: Model.ManyToManyRelation,
        modelClass: Task,
        join: {
          from: 'labels.id',
          through: {
            from: 'task_label.labelId',
            to: 'task_label.taskId',
          },
          to: 'tasks.id',
        },
      },
    }
  }
}

export default Label
