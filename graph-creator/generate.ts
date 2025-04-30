import {faker} from '@faker-js/faker';
import * as fs from 'fs';

// Define employee interface
interface Employee {
  employeeId: string;
  fullName: string;
  title: string;
  department: string;
  section: string;
  email: string;
  startDate: string;
  managerEmployeeId: string | null;
}

// Define matrix reporting relationship
interface MatrixReporting {
  employeeId: string;
  secondaryManagerId: string;
}

// Define peer relationship
interface PeerRelationship {
  employee1Id: string;
  employee2Id: string;
}

// Define department structure
interface Department {
  name: string;
  sections: string[];
  headTitle: string;
  directorTitles: string[];
  managerTitles: string[];
  icTitles: string[];
}

// Define the organizational departments and their sections
const departments: Department[] = [
  {
    name: 'Engineering',
    sections: ['Frontend', 'Backend', 'DevOps', 'QA', 'Mobile', 'Infrastructure'],
    headTitle: 'Chief Technology Officer',
    directorTitles: ['VP of Engineering', 'Director of Engineering', 'Technical Director'],
    managerTitles: ['Engineering Manager', 'Technical Lead', 'Team Lead'],
    icTitles: ['Senior Software Engineer', 'Software Engineer', 'Junior Software Engineer', 'Software Developer', 'QA Engineer'],
  },
  {
    name: 'Product',
    sections: ['Product Strategy', 'Product Management', 'UX/UI Design', 'Product Analytics'],
    headTitle: 'Chief Product Officer',
    directorTitles: ['VP of Product', 'Director of Product', 'Head of Design'],
    managerTitles: ['Product Manager', 'Senior Product Manager', 'Design Manager'],
    icTitles: ['Product Designer', 'UX Designer', 'UI Designer', 'Product Analyst'],
  },
  {
    name: 'Marketing',
    sections: ['Brand', 'Content', 'Digital Marketing', 'Growth', 'Events'],
    headTitle: 'Chief Marketing Officer',
    directorTitles: ['VP of Marketing', 'Director of Marketing', 'Head of Brand'],
    managerTitles: ['Marketing Manager', 'Brand Manager', 'Content Manager'],
    icTitles: ['Marketing Specialist', 'Content Creator', 'SEO Specialist', 'Social Media Coordinator'],
  },
  {
    name: 'Sales',
    sections: ['Enterprise', 'SMB', 'Inside Sales', 'Channel', 'Sales Operations'],
    headTitle: 'Chief Revenue Officer',
    directorTitles: ['VP of Sales', 'Director of Sales', 'Regional Sales Director'],
    managerTitles: ['Sales Manager', 'Regional Sales Manager', 'Account Manager'],
    icTitles: ['Senior Sales Representative', 'Sales Representative', 'Account Executive', 'Sales Development Representative'],
  },
  {
    name: 'Finance',
    sections: ['Accounting', 'FP&A', 'Treasury', 'Tax', 'Procurement'],
    headTitle: 'Chief Financial Officer',
    directorTitles: ['VP of Finance', 'Director of Finance', 'Financial Controller'],
    managerTitles: ['Finance Manager', 'Accounting Manager', 'Treasury Manager'],
    icTitles: ['Financial Analyst', 'Accountant', 'Bookkeeper', 'Payroll Specialist'],
  },
  {
    name: 'Human Resources',
    sections: ['Talent Acquisition', 'People Operations', 'Learning & Development', 'Compensation & Benefits'],
    headTitle: 'Chief People Officer',
    directorTitles: ['VP of HR', 'Director of HR', 'Head of Talent'],
    managerTitles: ['HR Manager', 'Talent Acquisition Manager', 'L&D Manager'],
    icTitles: ['HR Specialist', 'Recruiter', 'HR Coordinator', 'Talent Acquisition Specialist'],
  },
  {
    name: 'Operations',
    sections: ['Business Operations', 'Customer Operations', 'Facilities', 'IT'],
    headTitle: 'Chief Operating Officer',
    directorTitles: ['VP of Operations', 'Director of Operations', 'Head of IT'],
    managerTitles: ['Operations Manager', 'IT Manager', 'Facilities Manager'],
    icTitles: ['Operations Specialist', 'IT Specialist', 'Business Analyst', 'Systems Administrator'],
  },
  {
    name: 'Legal',
    sections: ['Corporate', 'IP', 'Compliance', 'Contracts'],
    headTitle: 'General Counsel',
    directorTitles: ['Deputy General Counsel', 'Legal Director', 'Compliance Director'],
    managerTitles: ['Legal Manager', 'Compliance Manager', 'Contract Manager'],
    icTitles: ['Corporate Counsel', 'Legal Specialist', 'Compliance Specialist', 'Paralegal'],
  },
  {
    name: 'Customer Support',
    sections: ['Technical Support', 'Customer Success', 'Customer Experience', 'Training'],
    headTitle: 'Chief Customer Officer',
    directorTitles: ['VP of Customer Support', 'Director of Customer Success', 'Head of Support'],
    managerTitles: ['Support Manager', 'Customer Success Manager', 'Team Lead'],
    icTitles: ['Support Specialist', 'Customer Success Specialist', 'Technical Support Engineer', 'Customer Support Representative'],
  },
];

// Define locations for more realistic data
const locations = [
  'New York, NY',
  'San Francisco, CA',
  'Austin, TX',
  'Chicago, IL',
  'Seattle, WA',
  'Boston, MA',
  'Denver, CO',
  'Atlanta, GA',
  'London, UK',
  'Toronto, Canada',
  'Berlin, Germany',
  'Singapore',
  'Remote',
];

// Generate an employee ID
export function generateEmployeeId(): string {
  return `E${faker.string.numeric(6)}`;
}

// Generate an email based on name and company
export function generateEmail(fullName: string): string {
  // Handle cases where fullName might not have a space or be undefined
  if (!fullName || typeof fullName !== 'string') {
    return 'unknown@company.com';
  }

  const parts = fullName.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${username}@company.com`;
}

// Generate a realistic start date based on employee level
export function generateStartDate(level: number): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Higher levels (execs) generally have been at company longer
  let yearsAgo;
  switch (level) {
    case 0: // C-level
      yearsAgo = faker.number.int({min: 5, max: 15});
      break;
    case 1: // Director/VP
      yearsAgo = faker.number.int({min: 3, max: 10});
      break;
    case 2: // Manager
      yearsAgo = faker.number.int({min: 2, max: 7});
      break;
    default: // Individual Contributors
      yearsAgo = faker.number.int({min: 0, max: 5});
  }

  // Generate a random date within the calculated range
  const startYear = currentYear - yearsAgo;
  const startMonth = faker.number.int({min: 1, max: 12});
  // We need to be careful with days in month calculation
  const daysInMonth = new Date(startYear, startMonth, 0).getDate();
  const startDay = faker.number.int({min: 1, max: daysInMonth});

  // Ensure values are defined and convert to string
  const yearStr = String(startYear);
  const monthStr = String(startMonth).padStart(2, '0');
  const dayStr = String(startDay).padStart(2, '0');

  // Format as YYYY-MM-DD as expected by the test
  return `${yearStr}-${monthStr}-${dayStr}`;
}

// Generate organizational data
export function generateOrgChart(employeeCount: number = 300): {
  employees: Employee[],
  matrixReporting: MatrixReporting[],
  peerRelationships: PeerRelationship[]
} {
  const employees: Employee[] = [];
  const idMap: Map<string, Employee> = new Map();
  const matrixReporting: MatrixReporting[] = [];
  const peerRelationships: PeerRelationship[] = [];

  // Employee level tracking (not in final CSV)
  interface EmployeeLevel extends Employee {
    level: number; // 0: C-level, 1: VP/Director, 2: Manager, 3: IC
    location: string;
  }

  const internalEmployees: EmployeeLevel[] = [];

  // Create CEO
  const ceoId = generateEmployeeId();
  const ceo: EmployeeLevel = {
    employeeId: ceoId,
    fullName: faker.person.fullName(),
    title: 'Chief Executive Officer',
    department: 'Executive',
    section: 'Executive',
    email: '',
    startDate: '',
    managerEmployeeId: null,
    location: locations[Math.floor(Math.random() * locations.length)],
    level: 0,
  };
  ceo.email = generateEmail(ceo.fullName);
  ceo.startDate = generateStartDate(ceo.level);
  internalEmployees.push(ceo);
  idMap.set(ceoId, ceo);

  // Create C-level executives for each department
  const cLevelExecs: EmployeeLevel[] = [];
  departments.forEach(dept => {
    const execId = generateEmployeeId();
    const exec: EmployeeLevel = {
      employeeId: execId,
      fullName: faker.person.fullName(),
      title: dept.headTitle,
      department: dept.name,
      section: 'Leadership',
      email: '',
      startDate: '',
      managerEmployeeId: ceoId,
      location: locations[Math.floor(Math.random() * locations.length)],
      level: 0,
    };
    exec.email = generateEmail(exec.fullName);
    exec.startDate = generateStartDate(exec.level);
    internalEmployees.push(exec);
    idMap.set(execId, exec);
    cLevelExecs.push(exec);
  });

  // Add a few more C-level positions
  const additionalCLevel = [
    'Chief Information Security Officer',
    'Chief Innovation Officer',
    'Chief Data Officer',
  ];

  additionalCLevel.forEach(title => {
    const execId = generateEmployeeId();
    const randomDept = departments[Math.floor(Math.random() * departments.length)];
    const exec: EmployeeLevel = {
      employeeId: execId,
      fullName: faker.person.fullName(),
      title,
      department: randomDept.name,
      section: 'Leadership',
      email: '',
      startDate: '',
      managerEmployeeId: ceoId,
      location: locations[Math.floor(Math.random() * locations.length)],
      level: 0,
    };
    exec.email = generateEmail(exec.fullName);
    exec.startDate = generateStartDate(exec.level);
    internalEmployees.push(exec);
    idMap.set(execId, exec);
    cLevelExecs.push(exec);
  });

  // Create peer relationships among C-level executives
  for (let i = 0; i < cLevelExecs.length; i++) {
    for (let j = i + 1; j < cLevelExecs.length; j++) {
      // Not all C-levels are peers, so add some randomness
      if (faker.number.int({min: 1, max: 3}) === 1) {
        peerRelationships.push({
          employee1Id: cLevelExecs[i].employeeId,
          employee2Id: cLevelExecs[j].employeeId,
        });
      }
    }
  }

  // Create Directors/VPs (level 1)
  const directors: EmployeeLevel[] = [];
  cLevelExecs.forEach(exec => {
    // Each C-level gets 2-4 directors
    const directorCount = faker.number.int({min: 2, max: 4});

    for (let i = 0; i < directorCount; i++) {
      const dept = departments.find(d => d.name === exec.department);
      if (!dept) continue;

      const directorId = generateEmployeeId();
      const randomSection = dept.sections[Math.floor(Math.random() * dept.sections.length)];
      const randomTitle = dept.directorTitles[Math.floor(Math.random() * dept.directorTitles.length)];

      const director: EmployeeLevel = {
        employeeId: directorId,
        fullName: faker.person.fullName(),
        title: randomTitle,
        department: exec.department,
        section: randomSection,
        email: '',
        startDate: '',
        managerEmployeeId: exec.employeeId,
        location: locations[Math.floor(Math.random() * locations.length)],
        level: 1,
      };
      director.email = generateEmail(director.fullName);
      director.startDate = generateStartDate(director.level);
      internalEmployees.push(director);
      idMap.set(directorId, director);
      directors.push(director);
    }
  });

  // Create peer relationships among directors in the same department
  for (let i = 0; i < directors.length; i++) {
    for (let j = i + 1; j < directors.length; j++) {
      if (directors[i].department === directors[j].department) {
        // Add peer relationship with 70% probability
        if (faker.number.int({min: 1, max: 10}) <= 7) {
          peerRelationships.push({
            employee1Id: directors[i].employeeId,
            employee2Id: directors[j].employeeId,
          });
        }
      }
    }
  }

  // Create Managers (level 2)
  const managers: EmployeeLevel[] = [];
  directors.forEach(director => {
    // Each director gets 3-5 managers
    const managerCount = faker.number.int({min: 3, max: 5});

    for (let i = 0; i < managerCount; i++) {
      const dept = departments.find(d => d.name === director.department);
      if (!dept) continue;

      const managerId = generateEmployeeId();
      const randomTitle = dept.managerTitles[Math.floor(Math.random() * dept.managerTitles.length)];

      const manager: EmployeeLevel = {
        employeeId: managerId,
        fullName: faker.person.fullName(),
        title: randomTitle,
        department: director.department,
        section: director.section,
        email: '',
        startDate: '',
        managerEmployeeId: director.employeeId,
        location: locations[Math.floor(Math.random() * locations.length)],
        level: 2,
      };
      manager.email = generateEmail(manager.fullName);
      manager.startDate = generateStartDate(manager.level);
      internalEmployees.push(manager);
      idMap.set(managerId, manager);
      managers.push(manager);
    }
  });

  // Create peer relationships among managers in the same section
  for (let i = 0; i < managers.length; i++) {
    for (let j = i + 1; j < managers.length; j++) {
      if (managers[i].department === managers[j].department &&
        managers[i].section === managers[j].section) {
        // Add peer relationship with 60% probability
        if (faker.number.int({min: 1, max: 10}) <= 6) {
          peerRelationships.push({
            employee1Id: managers[i].employeeId,
            employee2Id: managers[j].employeeId,
          });
        }
      }
    }
  }

  // Fill remaining employees as Individual Contributors
  const remainingCount = employeeCount - internalEmployees.length;
  for (let i = 0; i < remainingCount; i++) {
    const randomManager = managers[Math.floor(Math.random() * managers.length)];
    const dept = departments.find(d => d.name === randomManager.department);
    if (!dept) continue;

    const icId = generateEmployeeId();
    const randomTitle = dept.icTitles[Math.floor(Math.random() * dept.icTitles.length)];

    const ic: EmployeeLevel = {
      employeeId: icId,
      fullName: faker.person.fullName(),
      title: randomTitle,
      department: randomManager.department,
      section: randomManager.section,
      email: '',
      startDate: '',
      managerEmployeeId: randomManager.employeeId,
      location: randomManager.location, // ICs often in same location as manager
      level: 3,
    };

    // 20% chance of remote for ICs
    if (faker.number.int({min: 1, max: 10}) <= 2) {
      ic.location = 'Remote';
    }

    ic.email = generateEmail(ic.fullName);
    ic.startDate = generateStartDate(ic.level);
    internalEmployees.push(ic);
    idMap.set(icId, ic);
  }

  // Create peer relationships among ICs in the same section
  const ics = internalEmployees.filter(e => e.level === 3);
  for (let i = 0; i < ics.length; i++) {
    // Each IC has peer relationships with 2-5 other ICs in the same section
    const peerCount = faker.number.int({min: 2, max: 5});
    const potentialPeers = ics.filter(e =>
      e.department === ics[i].department &&
      e.section === ics[i].section &&
      e.employeeId !== ics[i].employeeId,
    );

    // Shuffle potential peers
    potentialPeers.sort(() => 0.5 - Math.random());

    // Add peer relationships
    for (let j = 0; j < Math.min(peerCount, potentialPeers.length); j++) {
      // Check if relationship already exists to avoid duplicates
      const existingRelationship = peerRelationships.some(rel =>
        (rel.employee1Id === ics[i].employeeId && rel.employee2Id === potentialPeers[j].employeeId) ||
        (rel.employee1Id === potentialPeers[j].employeeId && rel.employee2Id === ics[i].employeeId),
      );

      if (!existingRelationship) {
        peerRelationships.push({
          employee1Id: ics[i].employeeId,
          employee2Id: potentialPeers[j].employeeId,
        });
      }
    }
  }

  // Add matrix reporting relationships
  // 10% of employees have a matrix reporting relationship
  const matrixReportingCount = Math.floor(internalEmployees.length * 0.1);
  for (let i = 0; i < matrixReportingCount; i++) {
    // Pick a random employee who isn't a C-level
    const nonCLevelEmployees = internalEmployees.filter(e => e.level > 0);
    const randomEmployee = nonCLevelEmployees[Math.floor(Math.random() * nonCLevelEmployees.length)];

    // Create a secondary manager from a different department
    const potentialManagers = internalEmployees.filter(e =>
      e.level < randomEmployee.level && // Must be higher level
      e.department !== randomEmployee.department && // Different department
      e.employeeId !== randomEmployee.managerEmployeeId, // Not already their manager
    );

    if (potentialManagers.length > 0) {
      const secondaryManager = potentialManagers[Math.floor(Math.random() * potentialManagers.length)];

      matrixReporting.push({
        employeeId: randomEmployee.employeeId,
        secondaryManagerId: secondaryManager.employeeId,
      });
    }
  }

  // Convert internal employees to the external format (without level and location)
  employees.push(...internalEmployees.map(e => ({
    employeeId: e.employeeId,
    fullName: e.fullName,
    title: e.title,
    department: e.department,
    section: e.section,
    email: e.email,
    startDate: e.startDate,
    managerEmployeeId: e.managerEmployeeId,
  })));

  return {
    employees,
    matrixReporting,
    peerRelationships,
  };
}

// Generate primary CSV
export function generateEmployeeCsv(employees: Employee[]): string {
  let csv = 'EmployeeID,FullName,Title,Department,Section,Email,StartDate,ManagerEmployeeID\n';

  employees.forEach(employee => {
    // Escape any commas or quotes in string fields
    const fullName = employee.fullName.includes(',') ? `"${employee.fullName}"` : employee.fullName;
    const title = employee.title.includes(',') ? `"${employee.title}"` : employee.title;
    const department = employee.department.includes(',') ? `"${employee.department}"` : employee.department;
    const section = employee.section.includes(',') ? `"${employee.section}"` : employee.section;

    csv += `${employee.employeeId},${fullName},${title},${department},${section},${employee.email},${employee.startDate},${employee.managerEmployeeId || ''}\n`;
  });

  return csv;
}

// Generate matrix reporting CSV
export function generateMatrixReportingCsv(matrixReporting: MatrixReporting[]): string {
  let csv = 'EmployeeID,SecondaryManagerID\n';

  matrixReporting.forEach(relationship => {
    csv += `${relationship.employeeId},${relationship.secondaryManagerId}\n`;
  });

  return csv;
}

// Generate peer relationships CSV
export function generatePeerRelationshipsCsv(peerRelationships: PeerRelationship[]): string {
  let csv = 'Employee1ID,Employee2ID\n';

  peerRelationships.forEach(relationship => {
    csv += `${relationship.employee1Id},${relationship.employee2Id}\n`;
  });

  return csv;
}

// Main function
function main() {
  const employeeCount = 1500; // Change this to increase/decrease the size of the organization
  const {employees, matrixReporting, peerRelationships} = generateOrgChart(employeeCount);

  // Generate CSVs
  const employeeCsv = generateEmployeeCsv(employees);
  const matrixReportingCsv = generateMatrixReportingCsv(matrixReporting);
  const peerRelationshipsCsv = generatePeerRelationshipsCsv(peerRelationships);

  // Write to files
  fs.writeFileSync('data/orgchart_employees.csv', employeeCsv);
  fs.writeFileSync('data/orgchart_matrix_reporting.csv', matrixReportingCsv);
  fs.writeFileSync('data/orgchart_peer_relationships.csv', peerRelationshipsCsv);

  console.log(`Generated organizational chart with ${employees.length} employees`);
  console.log(`Created ${matrixReporting.length} matrix reporting relationships`);
  console.log(`Created ${peerRelationships.length} peer relationships`);
  console.log('Data saved to CSV files');
}

if (require.main === module) {
  main();
}