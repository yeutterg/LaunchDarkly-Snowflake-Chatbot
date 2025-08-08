-- Gravity Farms Petfood AI Chatbot - Snowflake Permissions Check
-- Purpose: Run this script to validate that your current role and session can successfully
-- perform the actions required by the setup script (create DB/schema/tables/functions, insert data).
--
-- Usage:
--   - Optionally set your role and warehouse before running:
--       USE ROLE ACCOUNTADMIN;            -- if you have access
--       USE WAREHOUSE COMPUTE_WH;         -- or any warehouse you can use
--   - Then run this entire script.
--
-- Notes:
--   - This script creates a temporary test database/schema/table/function, validates operations,
--     and cleans them up at the end.
--   - It also checks whether the target database/schema already exist and whether you have USAGE.

DECLARE
  target_db STRING DEFAULT 'GRAVITY_FARMS_PETFOOD_AI';
  target_schema STRING DEFAULT 'CHATBOT';

  rand_suffix STRING;
  test_db STRING;
  test_schema STRING;
  test_table STRING;
  test_func  STRING;

  current_wh STRING;

  db_count NUMBER DEFAULT 0;
  sc_count NUMBER DEFAULT 0;
BEGIN
  -- Initialize variables that depend on other variables
  LET rand_suffix := REPLACE(UUID_STRING(), '-', '_');
  LET test_db := 'GF_PERM_CHECK_' || rand_suffix;
  LET test_schema := 'CHECK_' || rand_suffix;
  LET test_table := 'T_' || rand_suffix;
  LET test_func := 'F_' || rand_suffix;

  -- Results table
  CREATE TEMP TABLE PERMISSION_CHECK_RESULTS (
    check_name STRING,
    status     STRING,
    details    STRING
  );

  -- Warehouse checks
  LET current_wh := CURRENT_WAREHOUSE();
  IF (current_wh IS NULL) THEN
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
      'WAREHOUSE_ACTIVE', 'FAIL', 'No active warehouse. Run: USE WAREHOUSE <name>;' );
  ELSE
    BEGIN
      -- Ensure we can execute a query (implicitly uses the active warehouse)
      SELECT 1;
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
        'WAREHOUSE_ACTIVE', 'PASS', 'Current warehouse: ' || current_wh );
    EXCEPTION
      WHEN OTHER THEN
        INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
          'WAREHOUSE_ACTIVE', 'FAIL', SQLERRM );
    END;
  END IF;

  -- Test CREATE DATABASE privilege
  BEGIN
    EXECUTE IMMEDIATE 'CREATE DATABASE ' || test_db;
    EXECUTE IMMEDIATE 'DROP DATABASE ' || test_db;
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
      'CREATE_DATABASE', 'PASS', 'Able to create/drop databases');
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
        'CREATE_DATABASE', 'FAIL', SQLERRM);
  END;

  -- Recreate test DB for further object-creation checks
  BEGIN
    EXECUTE IMMEDIATE 'CREATE DATABASE ' || test_db;
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
      'TEST_DB_CREATED', 'PASS', test_db );
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
        'TEST_DB_CREATED', 'FAIL', 'Could not create ' || test_db || ': ' || SQLERRM);
  END;

  -- Create schema in test DB
  BEGIN
    EXECUTE IMMEDIATE 'CREATE SCHEMA ' || test_db || '.' || test_schema;
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
      'CREATE_SCHEMA', 'PASS', test_db || '.' || test_schema );
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
        'CREATE_SCHEMA', 'FAIL', SQLERRM);
  END;

  -- Create table and insert a row (requires active warehouse & DML rights)
  BEGIN
    EXECUTE IMMEDIATE 'CREATE TABLE ' || test_db || '.' || test_schema || '.' || test_table || ' (id INT, name STRING)';
    EXECUTE IMMEDIATE 'INSERT INTO ' || test_db || '.' || test_schema || '.' || test_table || ' VALUES (1, ''ok'')';
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
      'CREATE_TABLE_AND_INSERT', 'PASS', test_db || '.' || test_schema || '.' || test_table );
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
        'CREATE_TABLE_AND_INSERT', 'FAIL', SQLERRM);
  END;

  -- Create a simple SQL UDF and execute it
  BEGIN
    EXECUTE IMMEDIATE 'CREATE OR REPLACE FUNCTION ' || test_db || '.' || test_schema || '.' || test_func || ' (x INT) RETURNS INT LANGUAGE SQL AS $$ x + 1 $$';
    EXECUTE IMMEDIATE 'SELECT ' || test_db || '.' || test_schema || '.' || test_func || '(1)';
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
      'CREATE_AND_EXECUTE_FUNCTION', 'PASS', test_db || '.' || test_schema || '.' || test_func );
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES (
        'CREATE_AND_EXECUTE_FUNCTION', 'FAIL', SQLERRM);
  END;

  -- Check if the target DB/Schema exist and whether we can USE them
  BEGIN
    EXECUTE IMMEDIATE 'SHOW DATABASES LIKE ''' || target_db || '''';
    LET db_count := (SELECT COUNT(*) FROM TABLE(RESULT_SCAN(LAST_QUERY_ID())));
    IF (db_count > 0) THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('TARGET_DB_EXISTS', 'PASS', target_db);

      BEGIN
        EXECUTE IMMEDIATE 'USE DATABASE ' || target_db;
        EXECUTE IMMEDIATE 'SHOW SCHEMAS LIKE ''' || target_schema || ''' IN DATABASE ' || target_db;
        LET sc_count := (SELECT COUNT(*) FROM TABLE(RESULT_SCAN(LAST_QUERY_ID())));

        IF (sc_count > 0) THEN
          BEGIN
            EXECUTE IMMEDIATE 'USE SCHEMA ' || target_db || '.' || target_schema;
            SELECT 1;
            INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('USAGE_ON_TARGET_DB_SCHEMA', 'PASS', target_db || '.' || target_schema);
          EXCEPTION
            WHEN OTHER THEN
              INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('USAGE_ON_TARGET_DB_SCHEMA', 'FAIL', SQLERRM);
          END;
        ELSE
          INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('TARGET_SCHEMA_EXISTS', 'FAIL', 'Schema not found: ' || target_db || '.' || target_schema);
        END IF;
      EXCEPTION
        WHEN OTHER THEN
          INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('USAGE_ON_TARGET_DB_SCHEMA', 'FAIL', SQLERRM);
      END;
    ELSE
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('TARGET_DB_EXISTS', 'INFO', 'Database not found (will be created by setup): ' || target_db);
    END IF;
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('TARGET_DB_CHECK', 'FAIL', SQLERRM);
  END;

  -- Cleanup test artifacts
  BEGIN
    EXECUTE IMMEDIATE 'DROP DATABASE IF EXISTS ' || test_db;
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('CLEANUP', 'PASS', 'Dropped ' || test_db);
  EXCEPTION
    WHEN OTHER THEN
    INSERT INTO PERMISSION_CHECK_RESULTS VALUES ('CLEANUP', 'FAIL', 'Could not drop ' || test_db || ': ' || SQLERRM);
  END;

  -- Output results
  SELECT * FROM PERMISSION_CHECK_RESULTS ORDER BY check_name;
END;


