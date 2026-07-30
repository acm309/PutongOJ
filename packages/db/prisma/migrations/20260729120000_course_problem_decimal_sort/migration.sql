-- Preserve the existing fractional ordering semantics for course problems.
ALTER TABLE "CourseProblem"
  RENAME COLUMN "position" TO "sort";

ALTER TABLE "CourseProblem"
  ALTER COLUMN "sort" TYPE DECIMAL(30, 12)
  USING "sort"::DECIMAL(30, 12);

DROP INDEX IF EXISTS "CourseProblem_courseId_position_updatedAt_idx";

CREATE INDEX "CourseProblem_courseId_sort_updatedAt_idx"
  ON "CourseProblem"("courseId", "sort", "updatedAt");
