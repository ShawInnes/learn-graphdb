import {Client} from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import {parse} from 'csv-parse/sync';

/**
 * TypeScript importer for loading org chart data into Apache AGE (PostgreSQL graph extension)
 */

// Define interfaces for data structures
interface Employee {
  employeeId: string;
  fullName: string;
  title: string;
  department: string;
  section: string;
  email: string;
  startDate: string;
  managerEmployeeID: string | null;
}

interface MatrixReporting {
  employeeId: string;
  secondaryManagerId: string;
}

interface PeerRelationship {
  employee1Id: string;
  employee2Id: string;
}

// Configuration
const config = {
  dbConfig: {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  },
  graphName: 'orgchart',
  employeeCsvPath: 'data/orgchart_employees.csv',
  matrixReportingCsvPath: 'data/orgchart_matrix_reporting.csv',
  peerRelationshipsCsvPath: 'data/orgchart_peer_relationships.csv',
};

// Main import function
async function importOrgChart() {
  console.log('Starting import process...');

  // Create PostgreSQL client
  const client = new Client(config.dbConfig);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if AGE extension is installed
    await checkAgeExtension(client);

    // Create graph if it doesn't exist
    await createGraph(client);

    // Purge existing data
    await purgeGraph(client);

    // Read data from CSV files
    const employees = readEmployeesCsv();
    const matrixReporting = readMatrixReportingCsv();
    const peerRelationships = readPeerRelationshipsCsv();

    console.log(`Loaded ${employees.length} employees from CSV`);
    console.log(`Loaded ${matrixReporting.length} matrix reporting relationships from CSV`);
    console.log(`Loaded ${peerRelationships.length} peer relationships from CSV`);

    // Create vertices for employees
    await createEmployeeVertices(client, employees);

    // Create primary reporting relationships
    await createPrimaryReportingEdges(client, employees);

    // Create matrix reporting relationships
    await createMatrixReportingEdges(client, matrixReporting);

    // Create peer relationships
    await createPeerRelationshipEdges(client, peerRelationships);

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Check if AGE extension is installed
async function checkAgeExtension(client: Client) {
  try {
    await client.query('SELECT * FROM pg_extension WHERE extname = \'age\'');
    await client.query('CREATE EXTENSION IF NOT EXISTS age;');
    await client.query('SET search_path = ag_catalog, "$user", public;');
    console.log('Apache AGE extension is installed');
  } catch (error) {
    console.error('Apache AGE extension not found. Please install it first:');
    console.error('CREATE EXTENSION IF NOT EXISTS age;');
    throw new Error('Apache AGE extension is required');
  }
}

// Create graph if it doesn't exist
async function createGraph(client: Client) {
  try {
    // Check if graph exists first
    const checkResult = await client.query(`
        SELECT *
        FROM ag_catalog.ag_graph
        WHERE name = $1
    `, [config.graphName]);

    if (checkResult.rowCount === 0) {
      await client.query(`
        SELECT create_graph($1)
      `, [config.graphName]);
      console.log(`Created graph '${config.graphName}'`);
    } else {
      console.log(`Graph '${config.graphName}' already exists`);
    }
  } catch (error) {
    console.error('Error creating graph:', error);
    throw error;
  }
}

async function purgeGraph(client: Client) {
  try {
    await client.query(`
        SELECT *
        FROM cypher('${config.graphName}', $$
            MATCH (n) DETACH DELETE n
                      $$) as (v agtype);`);
    console.log(`Created graph '${config.graphName}'`);
  } catch (error) {
    console.error('Error purging graph:', error);
    throw error;
  }
}

// Read employees from CSV
function readEmployeesCsv(): Employee[] {
  try {
    const fileContent = fs.readFileSync(config.employeeCsvPath, {encoding: 'utf-8'});
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records.map((record: any) => ({
      employeeId: record.EmployeeID,
      fullName: record.FullName,
      title: record.Title,
      department: record.Department,
      section: record.Section,
      email: record.Email,
      startDate: record.StartDate,
      managerEmployeeID: record.ManagerEmployeeID,
    }));
  } catch (error) {
    console.error('Error reading employees CSV:', error);
    throw error;
  }
}

// Read matrix reporting relationships from CSV
function readMatrixReportingCsv(): MatrixReporting[] {
  try {
    const fileContent = fs.readFileSync(config.matrixReportingCsvPath, {encoding: 'utf-8'});
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records.map((record: any) => ({
      employeeId: record.EmployeeID,
      secondaryManagerId: record.SecondaryManagerID,
    }));
  } catch (error) {
    console.error('Error reading matrix reporting CSV:', error);
    throw error;
  }
}

// Read peer relationships from CSV
function readPeerRelationshipsCsv(): PeerRelationship[] {
  try {
    const fileContent = fs.readFileSync(config.peerRelationshipsCsvPath, {encoding: 'utf-8'});
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records.map((record: any) => ({
      employee1Id: record.Employee1ID,
      employee2Id: record.Employee2ID,
    }));
  } catch (error) {
    console.error('Error reading peer relationships CSV:', error);
    throw error;
  }
}

// Create employee vertices
async function createEmployeeVertices(client: Client, employees: Employee[]) {
  console.log('Creating employee vertices...');

  // Create a vertex for each employee
  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Count for progress tracking
    let count = 0;

    const chunkSize = 500;
    for (let i = 0; i < employees.length; i += chunkSize) {
      console.log('chunk', i);
      const chunk = employees.slice(i, i + chunkSize);

      await client.query(`
                  SELECT *
                  FROM cypher('${config.graphName}', $$
                      UNWIND $batch as emp
                      MERGE (e:Employee {
                      employeeId: emp.employeeId
                      })
                      SET e.fullName= emp.fullName,
                              e.email = emp.email,
                              e.title = emp.title MERGE (t:Title {name: emp.title})
                                  MERGE (d:Department {name : emp.department})
                                  MERGE (s: Section {name : emp.section})
                                  MERGE (dt: Date {date : emp.startDate})
                                  MERGE (e)-[:HAS_TITLE]->(t)
                                  MERGE (e)-[:IN_DEPARTMENT]->(d)
                                  MERGE (e)-[:IN_SECTION]->(s)
                                  MERGE (e)-[:STARTED_ON]->(dt)
                                  MERGE (d)-[:HAS_SECTION]->(s)
                                  $$, $1) as (v agtype);`,
        [
          JSON.stringify({
            batch: chunk.map(employee => (
              {
                employeeId: employee.employeeId,
                fullName: employee.fullName,
                title: employee.title,
                department: employee.department,
                section: employee.section,
                email: employee.email,
                startDate: employee.startDate,
              }
            )),
          }),
        ]);

      count++;

      if (count % 50 === 0) {
        console.log(`Progress: ${count} employees created`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(`Created ${employees.length} employee vertices`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating employee vertices:', error);
    throw error;
  }
}

// Create primary reporting edges
async function createPrimaryReportingEdges(client: Client, employees: Employee[]) {
  console.log('Creating primary reporting edges...');

  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Count for progress tracking
    let count = 0;

    // Create reporting relationships
    for (const employee of employees) {
      // Skip if no manager
      if (!employee.managerEmployeeID) {
        continue;
      }

      await client.query(`
          SELECT *
          FROM cypher('${config.graphName}', $$
              MATCH (e:Employee {employeeId: $employeeId})
              MATCH (m:Employee {employeeId: $managerId}) MERGE (e)-[:REPORTS_TO]->(m)
              $$, $1) as (v agtype);
      `, [
        JSON.stringify({
          employeeId: employee.employeeId,
          managerId: employee.managerEmployeeID,
        }),
      ]);

      count++;
      if (count % 50 === 0) {
        console.log(`Progress: ${count} reporting relationships created`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(`Created ${count} primary reporting edges`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating primary reporting edges:', error);
    throw error;
  }
}

// Create matrix reporting edges
async function createMatrixReportingEdges(client: Client, matrixReporting: MatrixReporting[]) {
  console.log('Creating matrix reporting edges...');

  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Count for progress tracking
    let count = 0;

    // Create matrix reporting relationships
    for (const relationship of matrixReporting) {
      await client.query(`
          SELECT *
          FROM cypher('${config.graphName}', $$
              MATCH (e:Employee {employeeId: $employeeId})
              MATCH (m:Employee {employeeId: $managerId}) MERGE (e)-[:DOTTED_LINE_TO]->(m)
              $$, $1) as (v agtype);
      `, [
        JSON.stringify({
          employeeId: relationship.employeeId,
          managerId: relationship.secondaryManagerId,
        }),
      ]);

      count++;

      if (count % 50 === 0) {
        console.log(`Progress: ${count} matrix reporting relationships created`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(`Created ${matrixReporting.length} matrix reporting edges`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating matrix reporting edges:', error);
    throw error;
  }
}

// Create peer relationship edges
async function createPeerRelationshipEdges(client: Client, peerRelationships: PeerRelationship[]) {
  console.log('Creating peer relationship edges...');

  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Count for progress tracking
    let count = 0;

    // Create peer relationships
    for (const relationship of peerRelationships) {
      await client.query(`
          SELECT *
          FROM cypher('${config.graphName}', $$
              MATCH (e1:Employee {employeeId: $employee1Id})
              MATCH (e2:Employee {employeeId: $employee2Id}) MERGE (e1)-[:PEER_WITH]->(e2)
              $$, $1) as (v agtype);
      `, [
        JSON.stringify({
          employee1Id: relationship.employee1Id,
          employee2Id: relationship.employee2Id,
        }),
      ]);

      count++;

      if (count % 50 === 0) {
        console.log(`Progress: ${count} peer relationships created`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(`Created ${peerRelationships.length} peer relationship edges`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating peer relationship edges:', error);
    throw error;
  }
}

// Run the import process
importOrgChart().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});