-- Replace the generated migration.sql with this (see steps). One ACTIVE booking per advisor/time.
DROP INDEX IF EXISTS "Booking_advisorId_startsAt_key";
CREATE UNIQUE INDEX "Booking_active_slot" ON "Booking" ("advisorId", "startsAt") WHERE "status" IN ('PENDING', 'CONFIRMED');
