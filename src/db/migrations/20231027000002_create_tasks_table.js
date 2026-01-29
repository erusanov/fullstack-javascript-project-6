export async function up(knex) {
  return knex.schema
    .createTable(
      'tasks',
      (table) => {
        table
          .increments('id')
          .primary();

        table
          .string('name')
          .notNullable();

        table
          .text('description');

        table
          .integer('status_id')
          .references('id')
          .inTable('task_statuses')
          .onDelete('RESTRICT');

        table
          .integer('creator_id')
          .references('id')
          .inTable('users')
          .onDelete('RESTRICT');

        table
          .integer('executor_id')
          .references('id')
          .inTable('users')
          .onDelete('SET NULL');

        table
          .timestamp('created_at')
          .defaultTo(knex.fn.now());

        table
          .timestamp('updated_at')
          .defaultTo(knex.fn.now());
      },
    );
}

export async function down(knex) {
  return knex.schema.dropTable('tasks');
}
