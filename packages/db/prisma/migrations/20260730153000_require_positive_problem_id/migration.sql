ALTER TABLE "Problem"
  ADD CONSTRAINT "Problem_id_positive" CHECK ("id" > 0);
