/* eslint-disable func-names */
// See https://dev.to/morz/knex-psql-updating-timestamps-like-a-pro-2fg6

const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION ${schema}.update_timestamp() RETURNS TRIGGER
    LANGUAGE plpgsql
    AS
    $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$;
  `);
};

exports.down = async function (knex) {
  return knex.raw(`
    DROP FUNCTION IF EXISTS ${schema}.update_timestamp() CASCADE;
  `);
};
