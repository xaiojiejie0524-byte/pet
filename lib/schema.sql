CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  species text NOT NULL CHECK (species IN ('貓','狗','其他')), breed text NOT NULL DEFAULT '',
  birthday date, weight_unit text NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg','g','lb')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('memory','weight','daily')), recorded_on date NOT NULL,
  title text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', weight numeric(8,2),
  food text NOT NULL DEFAULT '', water text NOT NULL DEFAULT '', toilet text NOT NULL DEFAULT '', activity text NOT NULL DEFAULT '',
  media_url text, tags text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entries_pet_date_idx ON entries(pet_id, recorded_on DESC);
