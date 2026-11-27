CREATE TABLE reach_daily (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total > 0),
  PRIMARY KEY (day, event)
);
