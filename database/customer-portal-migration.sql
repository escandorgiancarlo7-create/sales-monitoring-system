USE sales_monitoring;

ALTER TABLE sales
  MODIFY COLUMN employee_id BIGINT UNSIGNED NULL;
