export async function up(knex) {
  return knex.schema
    .createTable(
      'task_label',
      (table) => {
        table
          .increments('id')
          .primary()

        table
          .integer('task_id')
          .references('id')
          .inTable('tasks')
          .onDelete('CASCADE')

        table
          .integer('label_id')
          .references('id')
          .inTable('labels')
          .onDelete('RESTRICT')

        table
          .unique(['task_id', 'label_id'])

        table
          .timestamp('created_at')
          .defaultTo(knex.fn.now())

        table
          .timestamp('updated_at')
          .defaultTo(knex.fn.now())
      },
    )
}

export async function down(knex) {
  return knex.schema.dropTable('task_label')
}
