/* eslint-disable func-names */
exports.up = async function (knex) {
  const msg = `<p>The Buncombe County Court System will transition to a new electronic record-keeping system July 22. Court Reminders will return on July 23. People already signed up will continue to receive notifications.</p>
    <p>El sistema judicial del condado de Buncombe hará la transición a un nuevo sistema de mantenimiento de registros electrónicos el 22 de julio. Los recordatorios judiciales volverán el 23 de julio. Las personas que ya se hayan registrado seguirán recibiendo notificaciones.</p>
    <p>Судебная система округа Банкомб перейдет на новую электронную систему ведения документации 22 июля. Уведомления о судебных слушаниях вернутся 23 июля. Уже зарегистрированные люди продолжат получать уведомления.</p>
  `;
  await knex.schema.alterTable('cn_configuration', (table) => {
    table.text('detail').defaultTo('-');
  });
  await knex('cn_configuration').insert([
    { name: 'maintenance_mode', value: '0', detail: msg },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.alterTable('cn_configuration', (table) => {
    table.dropColumn('detail');
  });
};
