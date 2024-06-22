const mysql = require('mysql2/promise');
const connectDb = require('./db.js')
const ManagerRoles = {
    attraction: 'Менеджер по привлечению',
    personal: 'Персональный менеджер'
}

async function getManagersAndCustomers(connection) {
    const [managers] = await connection.query('SELECT * FROM managers');
    const [customers] = await connection.query('SELECT * FROM customers');
    const [assignments] = await connection.query('SELECT * FROM customer_to_manager_assign');
    return {managers, customers, assignments};
}

async function reassignCustomers(connection) {
    console.log('start')

    const [attractionManagers] = await connection.query(`SELECT * FROM managers 
    WHERE managers.role = '${ManagerRoles.attraction}'
    ORDER BY efficiency DESC;`);
    //count the number of clients for attraction manager
    const [attractionManagersBefore] = await connection.query(`
    SELECT Count(*)   from customer_to_manager_assign where manager_id in((select id from managers where managers.role = '${ManagerRoles.attraction}'))
    `)

    const attractionManagersBeforeLength = attractionManagersBefore[0]['Count(*)'];
    console.log(attractionManagersBeforeLength)
    const [customersWithoutOrder] = await connection.query(`
            SELECT id, city_id, first_order_date
            FROM customers
            WHERE first_order_date = 0;
        `);
    let assignments = ''
    for (let i = 0; i < customersWithoutOrder.length; i++) {
        assignments = assignments + `(${customersWithoutOrder[i].id},${customersWithoutOrder[i].city_id},${attractionManagers[Math.floor(Math.random() * attractionManagers.length)].id},'AKHAN')${i < customersWithoutOrder.length - 1 ? ',' : ';'}`
    }
// Проставляем пользователям менеджеров по привлечению
//      await connection.query(`
//     INSERT INTO customer_to_manager_assign(customer_id, city_id, manager_id,comment) VALUES
//     ${assignments}
//     `)
    const dateStr = '3 June 2024';
    const unixTimestamp = new Date(dateStr).getTime() / 1000;
    const [customersWithOrder] = await connection.query(`
    SELECT id, city_id, first_order_date from customers where first_order_date>${unixTimestamp}
    `)
    //открепляем тех кто сделал заказ от менеджеров привлечения
    await connection.query(`
      DELETE FROM customer_to_manager_assign
WHERE customer_to_manager_assign.city_id IN (
    SELECT city_id FROM customers WHERE first_order_date > ${unixTimestamp}
)
AND customer_to_manager_assign.customer_id IN (
    SELECT id FROM customers WHERE first_order_date > ${unixTimestamp}
)
AND customer_to_manager_assign.manager_id IN (
    SELECT id FROM managers WHERE managers.role = '${ManagerRoles.attraction}'
);`)

    const [personalManagers] = await connection.query(`
    select * from managers where managers.role = '${ManagerRoles.personal} and attached_clients_count<3000> ORDER by efficiency DESC'
    `)


    //Прикрепляем тех кто сделал заказ к персональным менеджерам
    await connection.query(`
    INSERT INTO customer_to_manager_assign(customer_id, city_id, manager_id,comment) VALUES
      select id , city_id,  from customers where  
    
    `)
}


(async () => {
    const connection = await connectDb();
    await reassignCustomers(connection);
    await connection.end();
    console.log('Task completed and reports generated.');
})();
