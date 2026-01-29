export async function up(knex) {
  return knex.schema
    .createTable(
      'labels',
      (table) => {
        table
          .increments('id')
          .primary();

        table
          .string('name')
          .notNullable()
          .unique();

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
  return knex.schema.dropTable('labels');
}
