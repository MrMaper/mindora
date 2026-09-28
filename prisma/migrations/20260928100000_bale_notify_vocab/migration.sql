-- Vocab review reminders follow the same admin switch as the other Bale alerts.
ALTER TABLE "bale_config" ADD COLUMN "notifyVocab" BOOLEAN NOT NULL DEFAULT true;
