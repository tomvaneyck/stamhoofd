import { Migration } from '../../database/classes/Migration';
import { Database } from '../../database/classes/Database';

export default new Migration(async () => {
    await Database.statement("test")
})