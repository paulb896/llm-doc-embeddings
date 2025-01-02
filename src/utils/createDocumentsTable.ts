export const createDocumentsTable = async (pgClient: any) => {
  const tableExistsQuery = `
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = 'documents'
    );
  `;
  const result = await pgClient.query(tableExistsQuery);
  if (!result.rows[0].exists) {
    const createTableQuery = `
      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_data BYTEA NOT NULL
      );
    `;
    await pgClient.query(createTableQuery);
    console.log("Table 'documents' created successfully.");
  }
};
