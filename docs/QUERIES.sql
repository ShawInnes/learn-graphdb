/*
* Sample Apache AGE Queries for OrgChart Graph
* These are useful queries to explore and analyze your organization chart
  */

SET search_path = ag_catalog, "$user", public;

-- 1. Find all employees in the Engineering department
SELECT *
FROM cypher('orgchart', $$
MATCH (e:Employee)-[:IN_DEPARTMENT]->(d:Department {name: 'Engineering'})
MATCH (e)-[:HAS_TITLE]->(t:Title)
MATCH (e)-[:IN_SECTION]->(s:Section)
RETURN e, t.name, d.name, s.name
ORDER BY s.name, t.name
$$) as (employee agtype, title agtype, department agtype, section agtype);

SELECT *
FROM cypher('orgchart', $$
MATCH (e:Employee)-[:HAS_TITLE]->(t:Title {name: 'IT Specialist'})
RETURN e as employee, t as title
$$) as (employee agtype, title agtype);

-- 3. Find the direct reports of a specific manager
SELECT *
FROM cypher('orgchart', $$
MATCH (manager:Employee {employeeId: 'E184306'})<-[:REPORTS_TO]-(report:Employee)
MATCH (report)-[:HAS_TITLE]->(t:Title)
MATCH (report)-[:IN_DEPARTMENT]->(d:Department)
RETURN report as employee, t as title, d as department
$$) as (employee agtype, title agtype, department agtype);

-- 14. Generate a full organizational tree (JSON format)
SELECT * FROM cypher('orgchart', $$MATCH (ceo:Employee)
WHERE NOT EXISTS((ceo)-[:REPORTS_TO]->())
WITH ceo
MATCH (e:Employee)-[r:REPORTS_TO*0..]->(ceo)
WITH collect(distinct {key: e.employeeId, attributes: {label: e.title, size: 10, x: 0, y: 0, name: e.fullName, title: e.title, department: e.department}}) as nodes
MATCH (e1)-[r2:REPORTS_TO]->(e2)
RETURN nodes,
collect(distinct {source: e1.employeeId, target: e2.employeeId}) as edges$$) as (nodes agtype, links agtype);


-- Go to the top

SELECT * FROM cypher('orgchart', $$
MATCH path = (employee:Employee {employeeId: 'E835546'})-[:REPORTS_TO*]->(ceo:Employee)
WHERE NOT EXISTS((ceo)-[:REPORTS_TO]->())
WITH path, ceo, employee
MATCH (nodes:Employee) WHERE nodes IN nodes(path)
WITH collect(distinct {key: nodes.employeeId, attributes: {label: nodes.title, size: 10, x: 0, y: 0, name: nodes.fullName, title: nodes.title, department: nodes.department}}) as nodes
MATCH (e1)-[r2:REPORTS_TO]->(e2) WHERE e1 IN nodes(path) AND e2 IN nodes(path)
RETURN nodes,
collect(distinct {source: e1.employeeId, target: e2.employeeId}) as edges$$) as (nodes agtype, edges agtype);
